/*
 * Ejecución interactiva con la salida en una terminal y, si el código usa
 * Flet, la app en una vista previa. La comparten los ejemplos de las
 * lecciones, el ejercicio y el playground.
 */

import { beginFletSession, usesFlet } from "../flet/runtime.js";
import { isPythonEngineReady } from "../python/libraries.js";
import { isRunning, runPython } from "../python/engine.js";
import { beginWebSession, lastRun } from "../web/runtime.js";

/** Líneas de cada archivo guardado que se enseñan en la consola. */
const FILE_PREVIEW_LINES = 8;

/**
 * @param {string} code
 * @param {ReturnType<import("./terminal.js").createTerminal>} terminal
 * @param {object} [options]
 * @param {string} [options.fileName] Si se indica, la salida empieza con "$ python <fileName>".
 * @param {number} [options.timeLimitMs]
 * @param {boolean} [options.showDuration] Añade "[terminado en X s]" al final.
 * @param {import("./editor.js").Editor} [options.editor] Editor donde marcar la línea del error.
 * @param {ReturnType<import("../flet/renderer.js").createFletRenderer>} [options.preview]
 *   Vista previa donde dibujar la app si el código usa Flet.
 * @param {(error: object) => void} [options.onError] Error al ejecutar o en un manejador de eventos.
 * @param {() => void} [options.onStart]
 */
export async function runInTerminal(code, terminal, options = {}) {
  if (isRunning()) return null;

  const preview = usesFlet(code) ? (options.preview ?? null) : null;
  options.editor?.markErrorLine(null);
  terminal.clear();
  const session = beginFletSession({
    renderer: preview,
    terminal,
    timeLimitMs: options.timeLimitMs,
    onError: (error) => {
      options.editor?.markErrorLine(error.line);
      options.onError?.(error);
    },
  });
  beginWebSession({
    terminal,
    timeLimitMs: options.timeLimitMs,
    onError: (error) => {
      options.editor?.markErrorLine(error.line);
      options.onError?.(error);
    },
  });
  if (options.fileName) terminal.line(`$ python ${options.fileName}`, "system");
  if (isPythonEngineReady() === undefined) {
    terminal.line("# cargando el motor de Python…", "system");
  }
  options.onStart?.();

  const result = await runPython(code, {
    timeLimitMs: options.timeLimitMs,
    onOutput: (text) => terminal.write(text),
    onPrompt: (prompt) => terminal.prompt(prompt),
  });
  terminal.dropPrompts();

  switch (result.status) {
    case "unavailable":
      terminal.line(
        "✗ El motor de Python no se pudo cargar. Revisa tu conexión y recarga la página.",
        "fail",
      );
      break;
    case "stopped":
      terminal.line("■ programa detenido", "system");
      break;
    case "error":
      terminal.showError(result.error);
      options.editor?.markErrorLine(result.error.line);
      options.onError?.(result.error);
      break;
    case "ok":
      if (preview) {
        // En los ejemplos (sin nombre de archivo) la vista previa ya lo dice todo.
        if (options.fileName) {
          terminal.line(
            session.rendered
              ? "# la app está en marcha: úsala en la vista previa"
              : "# el programa terminó sin abrir ninguna app: ¿falta ft.run(main)?",
            "system",
          );
        }
      } else if (lastRun().server) {
        terminal.line(
          `# tu servidor está en marcha en ${lastRun().server.origin}: pruébalo en la pestaña web`,
          "system",
        );
      } else if (!result.stdout) {
        terminal.line("(el programa no imprimió nada)", "system");
      }
      if (options.showDuration) {
        terminal.line(`[terminado en ${(result.durationMs / 1000).toFixed(2)} s]`, "system");
      }
      break;
  }
  if (result.status === "ok" || result.status === "error") showSavedFiles(terminal);
  if (preview && !session.rendered && result.status !== "busy") {
    preview.showMessage(
      result.status === "ok"
        ? "tu programa no llamó a ft.run(main)"
        : "la app no llegó a arrancar: mira la salida",
    );
  }
  return result;
}

/** Enseña los archivos que guardó el programa en el disco simulado, con sus primeras líneas. */
function showSavedFiles(terminal) {
  for (const [name, text] of lastRun().files) {
    const lines = text.replace(/\r\n?/g, "\n").replace(/\n$/, "").split("\n");
    const count = text ? lines.length : 0;
    terminal.line(
      `# archivo guardado: ${name} · ${count === 1 ? "1 línea" : `${count} líneas`}`,
      "system",
    );
    for (const line of lines.slice(0, FILE_PREVIEW_LINES)) terminal.line(`  ${line}`, "system");
    if (count > FILE_PREVIEW_LINES) {
      terminal.line(`  … (${count - FILE_PREVIEW_LINES} más)`, "system");
    }
  }
}
