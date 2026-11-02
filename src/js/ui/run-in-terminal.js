/*
 * Ejecución interactiva con la salida en una terminal y, si el código usa
 * Flet, la app en una vista previa. La comparten los ejemplos de las
 * lecciones, el ejercicio y el playground. Con pandas, numpy o matplotlib
 * (Pyodide), los gráficos aparecen dentro de la salida.
 */

import { beginFletSession, usesFlet } from "../flet/runtime.js";
import { needsPyodide } from "../pyodide/engine.js";
import { isPythonEngineReady } from "../python/libraries.js";
import { isRunning, runPython } from "../python/engine.js";
import { sqlDatabases } from "../sql/runtime.js";
import { beginWebSession, lastRun } from "../web/runtime.js";
import { commandLine } from "./format.js";

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
 * @param {string[]} [options.argv] Argumentos del programa (con su nombre delante): sys.argv.
 * @param {boolean} [options.keepFiles] Conserva el disco de la ejecución anterior.
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
  if (options.fileName) {
    terminal.line(
      `$ ${options.argv ? commandLine(options.argv) : `python ${options.fileName}`}`,
      "system",
    );
  }
  if (!needsPyodide(code) && isPythonEngineReady() === undefined) {
    terminal.line("# cargando el motor de Python…", "system");
  }
  options.onStart?.();

  const result = await runPython(code, {
    timeLimitMs: options.timeLimitMs,
    onOutput: (text, stream) => terminal.write(text, stream === "stderr" ? "warning" : "output"),
    onPrompt: (prompt) => terminal.prompt(prompt),
    onStatus: (text) => terminal.line(text, "system"),
    onFigure: (image) => terminal.image(image, "gráfico"),
    argv: options.argv,
    keepFiles: options.keepFiles,
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
      } else if (!result.stdout && !result.stderr && !result.figures?.length) {
        terminal.line("(el programa no imprimió nada)", "system");
      }
      if (result.exitCode) {
        terminal.line(
          `# terminó con sys.exit(): código de salida ${result.exitCode} (error)`,
          "system",
        );
      }
      if (options.showDuration) {
        terminal.line(`[terminado en ${(result.durationMs / 1000).toFixed(2)} s]`, "system");
      }
      break;
  }
  if (result.engine === "pyodide") {
    showUnshownFigures(terminal, result);
    if (result.status === "ok" || result.status === "error") {
      showSavedFiles(terminal, result.files ?? []);
    }
  } else if (result.status === "ok" || result.status === "error") {
    // Solo los que escribió esta ejecución: con keepFiles, el disco tiene también los anteriores.
    const { files, written } = lastRun();
    showSavedFiles(
      terminal,
      [...files].filter(([name]) => written.has(name)).map(([name, text]) => ({ name, text })),
    );
    showDatabases(terminal);
  }
  if (preview && !session.rendered && result.status !== "busy") {
    preview.showMessage(
      result.status === "ok"
        ? "tu programa no llamó a ft.run(main)"
        : "la app no llegó a arrancar: mira la salida",
    );
  }
  return result;
}

/** Las bases de datos que creó el programa (no las de práctica), con sus tablas y filas. */
function showDatabases(terminal) {
  const databases = sqlDatabases();
  if (!databases) return;
  for (const { name, kind } of databases.list()) {
    if (kind !== "file") continue;
    const tables = databases.describe(name);
    const detail = tables.length
      ? tables
          .map(
            (table) => `${table.name} (${table.count === 1 ? "1 fila" : `${table.count} filas`})`,
          )
          .join(", ")
      : "sin tablas";
    terminal.line(`# base de datos: ${name} · ${detail} · míralas en «datos»`, "system");
  }
}

/** Un aviso si el programa creó un gráfico sin llamar a plt.show(). */
function showUnshownFigures(terminal, result) {
  if (result.status === "ok" && result.unshown > 0) {
    terminal.line(
      "# creaste un gráfico, pero no se ve hasta que llamas a plt.show() al final",
      "system",
    );
  }
}

/**
 * Enseña los archivos que guardó el programa en el disco: las primeras líneas
 * de los de texto y las imágenes PNG (por ejemplo, un gráfico con savefig()).
 * @param {Array<{name: string, text?: string | null, image?: string | null, size?: number}>} files
 */
function showSavedFiles(terminal, files) {
  for (const { name, text, image, size } of files) {
    if (image) {
      terminal.line(`# imagen guardada: ${name}`, "system");
      terminal.image(image, name);
      continue;
    }
    if (text == null) {
      terminal.line(`# archivo guardado: ${name} · ${size} bytes`, "system");
      continue;
    }
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
