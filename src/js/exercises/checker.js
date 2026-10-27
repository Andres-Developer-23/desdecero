/*
 * Comprobación automática de ejercicios.
 *
 * Cada lección define en checks.json cómo se comprueba (ver README):
 *   requires / forbids  patrones que el código debe tener o no tener
 *   ignore              líneas que se quitan antes de comprobar
 *   runs                ejecuciones con entradas, salida esperada y código extra
 * y, opcionalmente, test.py con asserts que se añaden en la última ejecución.
 */

import { TIME_LIMIT_MS } from "../config.js";
import { isSyntaxError } from "../python/errors.js";
import { runPython } from "../python/engine.js";
import { countLines, indentLines, normalizeOutput, stripComments } from "./text.js";

/**
 * @typedef {object} CheckResult
 * @property {boolean} passed
 * @property {string} [reason] Motivo del fallo: requires, forbids, syntax, error, assertion,
 *   test-error, output, contains, inputs-exhausted, stopped, busy o unavailable.
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

  const studentCode = checks.ignore ? code.replace(new RegExp(checks.ignore, "gm"), "") : code;
  const studentLines = countLines(studentCode);
  const runs = checks.runs?.length ? checks.runs : [{}];

  for (const [index, run] of runs.entries()) {
    const isLast = index === runs.length - 1;
    const extraCode = [run.test, isLast ? lesson.test : ""].filter(Boolean).join("\n");
    const program = extraCode ? `${studentCode}\n${extraCode}\n` : studentCode;
    const label = runs.length > 1 ? `prueba ${index + 1}/${runs.length}` : "prueba";
    const inputs = run.inputs ?? [];

    terminal.line(
      `$ comprobar · ${label}${inputs.length ? ` · entradas: ${inputs.join(" · ")}` : ""}`,
      "system",
    );
    const result = await runPython(program, {
      inputs,
      timeLimitMs: TIME_LIMIT_MS.check,
      onOutput: (text) => terminal.write(text),
      onInputEcho: (prompt, value) => terminal.echoInput(prompt, value),
    });
    terminal.ensureNewline();

    const failure = evaluateRun(result, run, { studentLines, terminal });
    if (failure) return failure;
    terminal.line(`[ok] ${label}`, "ok");
  }

  return { passed: true };
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
function evaluateRun(result, run, { studentLines, terminal }) {
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

  if (run.output != null && normalizeOutput(result.stdout) !== normalizeOutput(run.output)) {
    terminal.line("✗ La salida no coincide.", "fail");
    terminal.line("  esperaba:", "system");
    terminal.line(indentLines(normalizeOutput(run.output)), "ok");
    terminal.line("  tu programa imprimió:", "system");
    terminal.line(indentLines(normalizeOutput(result.stdout) || "(nada)"), "error");
    return fail("output");
  }

  for (const expected of run.contains ?? []) {
    if (!result.stdout.includes(expected)) {
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

  const studentLine = error.frames.find((line) => line <= studentLines) ?? null;
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
