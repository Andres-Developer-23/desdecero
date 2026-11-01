/*
 * Python completo con Pyodide, para los programas que usan pandas, numpy o
 * matplotlib (Skulpt no los tiene). Corre en un Web Worker que se crea la
 * primera vez que hace falta: la primera carga descarga Python y los
 * paquetes (unos 20 MB, que luego quedan en la caché del navegador).
 *
 * Detener un programa, o pasarse del tiempo, termina el worker: el siguiente
 * programa vuelve a cargar Python, ya desde la caché.
 */

import runnerSource from "../../python/pyodide_runner.py";
import { PYODIDE_PACKAGES, TIME_LIMIT_MS, pyodideBaseUrl } from "../config.js";
import { modulesToPreload, neededPackages, translateStatus } from "./detect.js";
import { pyodideWorker } from "./worker.js";

let practiceFiles = {};
let practiceDatabases = {};
let worker = null;
let ready = null;
let everLoaded = false;
/** Lo que hay que hacer con cada mensaje del worker mientras corre un programa. */
let handlers = null;

/**
 * Los datos de práctica que tendrá el disco de cada programa.
 * @param {{files?: Record<string, string>, databases?: Record<string, string>}} sources
 *   files: archivos de content/data/; databases: scripts de content/db/.
 */
export function installPyodide({ files = {}, databases = {} } = {}) {
  practiceFiles = files;
  practiceDatabases = databases;
}

/** Los nombres de los archivos de práctica, ordenados. */
export const practiceFileNames = () => Object.keys(practiceFiles).sort();

/** true si el programa necesita Python completo. */
export const needsPyodide = (code) => neededPackages(code, PYODIDE_PACKAGES).length > 0;

function startWorker() {
  const source = `(${pyodideWorker.toString()})();`;
  const url = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
  worker = new Worker(url, { type: "module" });
  URL.revokeObjectURL(url);
  ready = new Promise((resolve) => {
    worker.onmessage = ({ data }) => {
      if (data.type === "ready") {
        everLoaded = true;
        resolve(true);
      } else if (data.type === "init-error") {
        console.warn("No se pudo cargar Pyodide:", data.message);
        resolve(false);
      } else {
        handlers?.[data.type]?.(data);
      }
    };
    worker.onerror = (event) => {
      console.warn("No se pudo cargar Pyodide:", event.message);
      resolve(false);
    };
  });
  worker.postMessage({ type: "init", indexURL: pyodideBaseUrl(), runnerSource });
}

function stopWorker() {
  worker?.terminate();
  worker = null;
  ready = null;
  handlers = null;
}

/**
 * Empieza a cargar Python y los paquetes por adelantado (por ejemplo, al abrir
 * una lección de pandas), para que la primera ejecución no tenga que esperar.
 * @param {string[]} [packages]
 */
export async function preloadPyodide(packages = ["pandas"]) {
  if (!worker) startWorker();
  if (!(await ready) || !worker) return;
  const code = packages.map((name) => `import ${name}`).join("\n");
  worker.postMessage({ type: "preload", packages, modules: modulesToPreload(packages, code) });
}

/**
 * Ejecuta un programa con Pyodide. Mismas opciones y resultado que runPython()
 * de python/engine.js, más el estado de la carga (onStatus) y, en el
 * resultado, los gráficos y los archivos que guardó.
 * @param {string} code
 * @param {import("../python/engine.js").RunOptions} options
 * @returns {{promise: Promise<object>, stop: () => void}}
 */
export function startPyodideRun(code, options = {}) {
  let finish;
  let timer = null;
  let stdout = "";
  let startedAt = 0;
  let done = false;
  const promise = new Promise((resolve) => (finish = resolve));

  function end(result) {
    if (done) return;
    done = true;
    clearTimeout(timer);
    handlers = null;
    finish({ stdout, figures: [], files: [], unshown: 0, ...result });
  }

  const stop = () => {
    stopWorker();
    end({ status: "stopped" });
  };

  (async () => {
    if (!worker) {
      options.onStatus?.(
        everLoaded
          ? "# reiniciando Python…"
          : "# cargando Python completo con pandas (la primera vez tarda un poco)…",
      );
      startWorker();
    }
    const loaded = await ready;
    if (done) return;
    if (!loaded) {
      stopWorker();
      end({ status: "unavailable" });
      return;
    }

    const timeLimitMs = options.timeLimitMs ?? TIME_LIMIT_MS.lesson;
    handlers = {
      status: ({ text }) => {
        const status = translateStatus(text, PYODIDE_PACKAGES);
        if (status) options.onStatus?.(status);
      },
      started: () => {
        startedAt = performance.now();
        timer = setTimeout(() => {
          stopWorker();
          end({
            status: "error",
            error: {
              type: "TimeLimitError",
              message: "Program exceeded run time limit.",
              line: null,
              frames: [],
            },
          });
        }, timeLimitMs);
      },
      stdout: ({ text }) => {
        stdout += text;
        options.onOutput?.(text);
      },
      stderr: ({ text }) => options.onOutput?.(text, "stderr"),
      echo: ({ prompt, value }) => options.onInputEcho?.(prompt, value),
      figure: ({ image }) => options.onFigure?.(image),
      done: ({ result }) => {
        if (result.status === "unavailable") {
          stopWorker();
          end({ status: "unavailable" });
          return;
        }
        end({
          status: result.status,
          error: result.error ? { ...result.error, engine: "pyodide" } : undefined,
          figures: result.figures ?? [],
          files: result.files ?? [],
          unshown: result.unshown ?? 0,
          durationMs: performance.now() - startedAt,
        });
      },
    };

    const packages = neededPackages(code, PYODIDE_PACKAGES);
    worker.postMessage({
      type: "run",
      code,
      files: practiceFiles,
      databases: practiceDatabases,
      inputs: Array.isArray(options.inputs) ? options.inputs : null,
      packages,
      modules: modulesToPreload(packages, code),
    });
  })();

  return { promise, stop };
}
