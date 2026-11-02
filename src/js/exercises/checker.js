/*
 * Comprobación automática de ejercicios.
 *
 * Cada lección define en checks.json cómo se comprueba (ver README):
 *   requires / forbids  patrones que el código debe tener o no tener
 *   ignore              líneas que se quitan antes de comprobar
 *   runs                ejecuciones con entradas, argumentos, salida esperada y código extra
 *   persist             las ejecuciones comparten el disco simulado (programas de línea de comandos)
 * y, opcionalmente, test.py con asserts que se añaden en la última ejecución.
 */

import { TIME_LIMIT_MS } from "../config.js";
import { beginFletSession } from "../flet/runtime.js";
import { isSyntaxError } from "../python/errors.js";
import { runPython } from "../python/engine.js";
import { beginWebSession } from "../web/runtime.js";
import { commandLine } from "../ui/format.js";
import { countLines, indentLines, normalizeOutput, stripComments } from "./text.js";

/**
 * @typedef {object} CheckResult
 * @property {boolean} passed
 * @property {string} [reason] Motivo del fallo: requires, forbids, syntax, error, assertion,
 *   test-error, output, contains, exited, inputs-exhausted, stopped, busy o unavailable.
 * @property {number | null} [errorLine] Línea del código del alumno donde falló, si se sabe.
 */

const fail = (reason, errorLine = null) => ({ passed: false, reason, errorLine });

/**
 * Comprueba el código de una lección y escribe el informe en la terminal.
 * @param {object} lesson
 * @param {string} code
 * @param {ReturnType<import("../ui/terminal.js").createTerminal>} terminal
 * @returns {Promise<CheckResult>}
 */
export async function checkExercise(lesson, code, terminal) {
  const checks = lesson.checks ?? {};

  const staticProblem = findStaticProblem(checks, code);
  if (staticProblem) {
    terminal.line(`✗ ${staticProblem.message}`, "fail");
    return fail(staticProblem.reason);
  }

  // Las comprobaciones no dibujan nada: la vista previa anterior se detiene.
  beginFletSession({ renderer: null, terminal });
  beginWebSession({ terminal, timeLimitMs: TIME_LIMIT_MS.check });

  const studentCode = checks.ignore ? code.replace(new RegExp(checks.ignore, "gm"), "") : code;
  const studentLines = countLines(studentCode);
  const runs = checks.runs?.length ? checks.runs : [{}];

  for (const [index, run] of runs.entries()) {
    const isLast = index === runs.length - 1;
    const extraCode = [run.test, isLast ? lesson.test : ""].filter(Boolean).join("\n");
    // «before» va delante del código del alumno (por ejemplo, para fijar el número secreto
    // de un juego): sus líneas se descuentan al decir dónde está un error.
    const before = run.before ? `${run.before.trimEnd()}\n` : "";
    const offset = before ? countLines(run.before.trimEnd()) : 0;
    const program = `${before}${studentCode}${extraCode ? `\n${extraCode}\n` : ""}`;
    const label = runs.length > 1 ? `prueba ${index + 1}/${runs.length}` : "prueba";
    const inputs = run.inputs ?? [];
    const argv = run.args ? [lesson.file ?? "programa.py", ...run.args] : undefined;

    terminal.line(
      `$ comprobar · ${label}${argv ? ` · ${commandLine(argv)}` : ""}${inputs.length ? ` · entradas: ${inputs.join(" · ")}` : ""}`,
      "system",
    );
    const result = await runPython(program, {
      inputs,
      argv,
      // Con persist, cada ejecución ve los archivos que dejó la anterior (la primera empieza vacía).
      keepFiles: Boolean(checks.persist) && index > 0,
      timeLimitMs: TIME_LIMIT_MS.check,
      onOutput: (text, stream) => terminal.write(text, stream === "stderr" ? "warning" : "output"),
      onInputEcho: (prompt, value) => terminal.echoInput(prompt, value),
      onStatus: (text) => terminal.line(text, "system"),
      onFigure: (image) => terminal.image(image, "gráfico"),
    });
    terminal.ensureNewline();

    const failure = evaluateRun(shiftLines(result, offset), run, {
      studentLines,
      terminal,
      hasTests: Boolean(extraCode),
    });
    if (failure) return failure;
    terminal.line(`[ok] ${label}`, "ok");
  }

  return { passed: true };
}

/** Las líneas de un error, contadas desde el código del alumno (sin el «before» de la prueba). */
function shiftLines(result, offset) {
  if (!offset || !result.error) return result;
  const shift = (line) => (line == null ? line : line - offset);
  const error = result.error;
  return {
    ...result,
    error: { ...error, line: shift(error.line), frames: error.frames.map(shift) },
  };
}

/** Revisa los patrones obligatorios y prohibidos sin ejecutar nada. */
function findStaticProblem(checks, code) {
  const withoutComments = stripComments(code);
  for (const rule of checks.requires ?? []) {
    if (!new RegExp(rule.pattern).test(withoutComments)) {
      return { reason: "requires", message: rule.message };
    }
  }
  for (const rule of checks.forbids ?? []) {
    if (new RegExp(rule.pattern).test(withoutComments)) {
      return { reason: "forbids", message: rule.message };
    }
  }
  return null;
}

/** Decide si una ejecución falló y lo explica en la terminal. Devuelve null si fue bien. */
function evaluateRun(result, run, { studentLines, terminal, hasTests }) {
  switch (result.status) {
    case "busy":
      return fail("busy");
    case "unavailable":
      terminal.line("✗ El motor de Python no está disponible.", "fail");
      return fail("unavailable");
    case "stopped":
      terminal.line("■ comprobación detenida", "system");
      return fail("stopped");
    case "inputs-exhausted":
      terminal.line(
        "✗ Tu programa pidió más datos con input() de los que esperaba esta prueba. ¿El bucle termina cuando debe?",
        "fail",
      );
      return fail("inputs-exhausted");
    case "error":
      return explainError(result.error, { studentLines, terminal });
  }

  // Con sys.exit() las comprobaciones que van detrás del programa no llegan a ejecutarse.
  if (hasTests && result.exitCode !== undefined) {
    terminal.line(
      "✗ Tu programa terminó con sys.exit() antes de llegar a las comprobaciones: en esta prueba debería terminar normalmente.",
      "fail",
    );
    return fail("exited");
  }

  if (run.output != null && normalizeOutput(result.stdout) !== normalizeOutput(run.output)) {
    terminal.line("✗ La salida no coincide.", "fail");
    terminal.line("  esperaba:", "system");
    terminal.line(indentLines(normalizeOutput(run.output)), "ok");
    terminal.line("  tu programa imprimió:", "system");
    terminal.line(indentLines(normalizeOutput(result.stdout) || "(nada)"), "error");
    return fail("output");
  }

  // Los mensajes de error pueden ir a la salida normal o a la de errores (sys.stderr).
  const printed = `${result.stdout}${result.stderr ?? ""}`;
  for (const expected of run.contains ?? []) {
    if (!printed.includes(expected)) {
      terminal.line(`✗ La salida debería incluir: ${expected}`, "fail");
      return fail("contains");
    }
  }
  return null;
}

/**
 * Distingue si el error está en el código del alumno o en las pruebas
 * añadidas después (asserts), y lo explica en consecuencia.
 */
function explainError(error, { studentLines, terminal }) {
  const inTests = (line) => line != null && line > studentLines;

  if (isSyntaxError(error)) {
    const line = Math.min(error.line ?? studentLines, studentLines);
    terminal.showError({ ...error, line });
    return fail("syntax", line);
  }

  if (error.type === "AssertionError" && inTests(error.line)) {
    terminal.line(`✗ ${error.message || "La comprobación no se cumplió."}`, "fail");
    return fail("assertion");
  }

  const studentLine = error.frames.find((line) => line >= 1 && line <= studentLines) ?? null;
  if (inTests(error.line) && studentLine == null) {
    terminal.line(
      `✗ La comprobación no pudo ejecutarse: ${error.type}${error.message ? `: ${error.message}` : ""}`,
      "fail",
    );
    terminal.line(
      "  → Revisa que uses exactamente los nombres de variables y funciones que pide el enunciado.",
      "explanation",
    );
    return fail("test-error");
  }

  terminal.showError({ ...error, line: studentLine });
  return fail("error", studentLine);
}
