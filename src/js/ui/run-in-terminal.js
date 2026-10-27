/*
 * Ejecución interactiva con la salida en una terminal. La comparten los
 * ejemplos de las lecciones, el ejercicio y el playground.
 */

import { isPythonEngineReady } from "../python/libraries.js";
import { isRunning, runPython } from "../python/engine.js";

/**
 * @param {string} code
 * @param {ReturnType<import("./terminal.js").createTerminal>} terminal
 * @param {object} [options]
 * @param {string} [options.fileName] Si se indica, la salida empieza con "$ python <fileName>".
 * @param {number} [options.timeLimitMs]
 * @param {boolean} [options.showDuration] Añade "[terminado en X s]" al final.
 * @param {import("./editor.js").Editor} [options.editor] Editor donde marcar la línea del error.
 * @param {() => void} [options.onStart]
 */
export async function runInTerminal(code, terminal, options = {}) {
  if (isRunning()) return null;

  options.editor?.markErrorLine(null);
  terminal.clear();
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
      break;
    case "ok":
      if (!result.stdout) terminal.line("(el programa no imprimió nada)", "system");
      if (options.showDuration) {
        terminal.line(`[terminado en ${(result.durationMs / 1000).toFixed(2)} s]`, "system");
      }
      break;
  }
  return result;
}
