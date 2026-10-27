/*
 * Ejecución de código Python con Skulpt.
 * Solo puede haber un programa en marcha a la vez en toda la página.
 */

import { TIME_LIMIT_MS } from "../config.js";
import { createEmitter } from "../lib/events.js";
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
 * @property {(text: string) => void} [onOutput] Recibe lo que el programa imprime.
 * @property {(prompt: string, value: string) => void} [onInputEcho] Muestra cada respuesta fija usada.
 * @property {number} [timeLimitMs]
 *
 * @typedef {object} RunResult
 * @property {"ok" | "error" | "stopped" | "inputs-exhausted" | "busy" | "unavailable"} status
 * @property {string} stdout
 * @property {ReturnType<typeof parseSkulptError>} [error]
 * @property {number} [durationMs]
 */

/**
 * @param {string} code
 * @param {RunOptions} [options]
 * @returns {Promise<RunResult>}
 */
export async function runPython(code, options = {}) {
  const ready = await loadPythonEngine();
  if (!ready) return { status: "unavailable", stdout: "" };
  if (running) return { status: "busy", stdout: "" };

  const Sk = window.Sk;
  const fixedInputs = Array.isArray(options.inputs) ? [...options.inputs] : null;
  let stdout = "";
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
    yieldLimit: 100,
    killableWhile: true,
    killableFor: true,
  });

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
    await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody("<stdin>", false, code, true));
    return { status: "ok", stdout, durationMs: performance.now() - startedAt };
  } catch (error) {
    if (stopped) return { status: "stopped", stdout };
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

function setRunning(value) {
  running = value;
  emitter.emit("running", value);
}

function readBuiltinFile(path) {
  const files = window.Sk.builtinFiles?.files;
  if (!files || files[path] === undefined) throw new Error(`File not found: '${path}'`);
  return files[path];
}
