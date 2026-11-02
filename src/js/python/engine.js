/*
 * Ejecución de código Python con Skulpt, o con Pyodide (Python completo) si
 * el programa usa pandas, numpy o matplotlib.
 * Solo puede haber un programa en marcha a la vez en toda la página.
 */

import { TIME_LIMIT_MS } from "../config.js";
import { createEmitter } from "../lib/events.js";
import { needsPyodide, startPyodideRun } from "../pyodide/engine.js";
import { loadPythonEngine } from "./libraries.js";
import { parseSkulptError } from "./errors.js";

const emitter = createEmitter();
let running = false;
let stopCurrent = null;

/** Avisa cuando empieza o termina una ejecución: listener(isRunning). */
export const onRunningChange = (listener) => emitter.on("running", listener);

export const isRunning = () => running;

/** Detiene el programa en marcha, si hay alguno. */
export function stopPython() {
  stopCurrent?.();
}

/**
 * @typedef {object} RunOptions
 * @property {string[]} [inputs] Respuestas fijas para input(). Si se acaban, termina con "inputs-exhausted".
 * @property {(prompt: string) => Promise<string>} [onPrompt] Pide la respuesta al usuario (modo interactivo).
 * @property {(text: string, stream?: "stderr") => void} [onOutput] Recibe lo que el programa
 *   imprime (y, con Pyodide, los avisos de la salida de errores, con stream "stderr").
 * @property {(text: string) => void} [onStatus] Mensajes mientras se carga Python completo.
 * @property {(png: string) => void} [onFigure] Con Pyodide: cada gráfico que enseña plt.show(),
 *   en PNG (base64), en el momento en que lo enseña.
 * @property {(prompt: string, value: string) => void} [onInputEcho] Muestra cada respuesta fija usada.
 * @property {number} [timeLimitMs]
 * @property {string[]} [argv] sys.argv: el nombre del programa y sus argumentos (solo con Skulpt).
 * @property {boolean} [keepFiles] Conserva el disco simulado de la ejecución anterior, como
 *   en un ordenador (para los programas de línea de comandos que guardan datos entre usos).
 *
 * @typedef {object} RunResult
 * @property {"ok" | "error" | "stopped" | "inputs-exhausted" | "busy" | "unavailable"} status
 * @property {string} stdout
 * @property {string} [stderr] Lo que escribió en la salida de errores (sys.stderr).
 * @property {number} [exitCode] Si terminó con sys.exit(): su código de salida (0 si fue bien).
 * @property {ReturnType<typeof parseSkulptError>} [error]
 * @property {number} [durationMs]
 * @property {"skulpt" | "pyodide"} [engine]
 * @property {string[]} [figures] Con Pyodide: los gráficos que enseñó, en PNG (base64).
 * @property {number} [unshown] Con Pyodide: figuras que se crearon y no se enseñaron.
 * @property {Array<{name: string, size: number, text: string | null, image: string | null}>} [files]
 *   Con Pyodide: los archivos que guardó.
 */

/**
 * @param {string} code
 * @param {RunOptions} [options]
 * @returns {Promise<RunResult>}
 */
export async function runPython(code, options = {}) {
  if (needsPyodide(code)) return runWithPyodide(code, options);
  const ready = await loadPythonEngine();
  if (!ready) return { status: "unavailable", stdout: "" };
  if (running) return { status: "busy", stdout: "" };

  const Sk = window.Sk;
  const fixedInputs = Array.isArray(options.inputs) ? [...options.inputs] : null;
  let stdout = "";
  let stderr = "";
  let stopped = false;
  let inputsExhausted = false;
  let rejectPendingInput = null;

  setRunning(true);
  stopCurrent = () => {
    stopped = true;
    Sk.execLimit = 1; // hace que Skulpt aborte en la siguiente comprobación
    rejectPendingInput?.(new Error("detenido"));
  };

  Sk.configure({
    output: (text) => {
      stdout += text;
      options.onOutput?.(text);
    },
    read: readBuiltinFile,
    __future__: Sk.python3,
    inputfunTakesPrompt: true,
    inputfun: (prompt) => {
      const promptText = prompt == null ? "" : String(prompt);
      if (fixedInputs) return nextFixedInput(promptText);
      return askUser(promptText);
    },
    execLimit: options.timeLimitMs ?? TIME_LIMIT_MS.lesson,
    // Siempre se pasa: si no, Skulpt conservaría los argumentos del programa anterior.
    sysargv: options.argv ?? [],
    yieldLimit: 100,
    killableWhile: true,
    killableFor: true,
  });
  // sys.stderr (ver stdlib.js) escribe aquí: se ve en la salida, pero no cuenta como stdout.
  Sk.desdeceroStderr = (text) => {
    stderr += text;
    options.onOutput?.(text, "stderr");
  };

  function nextFixedInput(promptText) {
    if (!fixedInputs.length) {
      inputsExhausted = true;
      return Promise.reject(new Error("sin entradas"));
    }
    const value = fixedInputs.shift();
    options.onInputEcho?.(promptText, value);
    resetTimeLimit();
    return Promise.resolve(value);
  }

  function askUser(promptText) {
    return new Promise((resolve, reject) => {
      rejectPendingInput = reject;
      Promise.resolve(options.onPrompt ? options.onPrompt(promptText) : "").then((value) => {
        rejectPendingInput = null;
        resetTimeLimit(); // el tiempo que el usuario tarda en escribir no cuenta
        resolve(value);
      }, reject);
    });
  }

  function resetTimeLimit() {
    Sk.execStart = Date.now();
  }

  const startedAt = performance.now();
  try {
    for (const setup of runSetups) await setup(Sk, code, options);
    await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, code, true));
    return {
      status: "ok",
      stdout,
      stderr,
      durationMs: performance.now() - startedAt,
      engine: "skulpt",
    };
  } catch (error) {
    if (stopped) return { status: "stopped", stdout };
    if (error instanceof Sk.builtin.SystemExit) {
      const exitCode = systemExitCode(Sk, error, Sk.desdeceroStderr);
      const durationMs = performance.now() - startedAt;
      return { status: "ok", stdout, stderr, exitCode, durationMs, engine: "skulpt" };
    }
    if (inputsExhausted) return { status: "inputs-exhausted", stdout };
    return {
      status: "error",
      stdout,
      error: parseSkulptError(error),
      durationMs: performance.now() - startedAt,
    };
  } finally {
    stopCurrent = null;
    setRunning(false);
  }
}

/**
 * sys.exit() termina el programa sin error, como en Python: sys.exit() y sys.exit(0) con
 * código 0; sys.exit(n), con n; y sys.exit("mensaje") escribe el mensaje en la salida de
 * errores y termina con código 1.
 */
function systemExitCode(Sk, error, writeStderr) {
  const value = error.args?.v?.[0];
  if (value === undefined || value === Sk.builtin.none.none$) return 0;
  if (Sk.builtin.checkInt(value)) return Number(Sk.ffi.remapToJs(value));
  writeStderr(`${new Sk.builtin.str(value).v}\n`);
  return 1;
}

/** Los programas con pandas, numpy o matplotlib van a Pyodide (ver pyodide/engine.js). */
async function runWithPyodide(code, options) {
  if (running) return { status: "busy", stdout: "" };
  setRunning(true);
  const run = startPyodideRun(code, options);
  stopCurrent = run.stop;
  try {
    return { ...(await run.promise), engine: "pyodide" };
  } finally {
    stopCurrent = null;
    setRunning(false);
  }
}

function setRunning(value) {
  running = value;
  emitter.emit("running", value);
}

/** Preparativos que se repiten antes de cada ejecución. */
const runSetups = [];

/**
 * Añade un preparativo que se ejecuta antes de cada programa, con Skulpt ya
 * configurado (por ejemplo, vaciar el disco simulado o cargar SQLite si el
 * código lo usa). Recibe Skulpt, el código y las opciones de la ejecución.
 * Puede ser asíncrono.
 * @param {(Sk: any, code: string, options: RunOptions) => void | Promise<void>} setup
 */
export function addRunSetup(setup) {
  runSetups.push(setup);
}

/** Módulos extra (por ejemplo el simulador de Flet), por ruta dentro de Skulpt. */
const extraFiles = new Map();

/** Añade módulos de Python propios: {"src/lib/nombre.py": "código"}. */
export function registerPythonFiles(files) {
  for (const [path, source] of Object.entries(files)) extraFiles.set(path, source);
}

function readBuiltinFile(path) {
  if (extraFiles.has(path)) return extraFiles.get(path);
  const files = window.Sk.builtinFiles?.files;
  if (!files || files[path] === undefined) throw new Error(`File not found: '${path}'`);
  return files[path];
}

let handlingEvent = false;

/**
 * Llama a una función de Python ya definida (por ejemplo, un manejador de
 * eventos de una app de Flet o el servidor de Flask) cuando el programa
 * principal ya terminó. Si va bien, value es lo que devolvió, convertido a
 * JavaScript.
 * @returns {Promise<{status: "ok" | "error" | "busy", value?: unknown, error?: ReturnType<typeof parseSkulptError>}>}
 */
export async function callPython(fn, args, { onOutput, timeLimitMs } = {}) {
  if (running || handlingEvent) return { status: "busy" };
  const Sk = window.Sk;
  handlingEvent = true;
  Sk.output = (text) => onOutput?.(text);
  Sk.execLimit = timeLimitMs ?? TIME_LIMIT_MS.lesson;
  Sk.execStart = Date.now();
  try {
    const pyArgs = args.map((value) => Sk.ffi.remapToPy(value));
    const result = await Sk.misceval.asyncToPromise(() =>
      Sk.misceval.callsimOrSuspendArray(fn, pyArgs),
    );
    return { status: "ok", value: Sk.ffi.remapToJs(result) };
  } catch (error) {
    return { status: "error", error: parseSkulptError(error) };
  } finally {
    handlingEvent = false;
  }
}
