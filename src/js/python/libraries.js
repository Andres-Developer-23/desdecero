/*
 * Carga bajo demanda de las librerías externas: CodeMirror (editor) y
 * Skulpt (Python en el navegador). Cada una se carga una sola vez.
 */

import { CODEMIRROR_ADDONS, codemirrorUrls, skulptUrls } from "../config.js";
import { loadScript } from "../lib/load-script.js";
import { applySkulptPatches } from "./skulpt-patches.js";

let editorLibrary = null;
let pythonEngine = null;
let pythonEngineReady; // undefined mientras carga, luego true o false

/** Resuelve true si CodeMirror quedó disponible. */
export function loadEditorLibrary() {
  editorLibrary ??= loadScript(codemirrorUrls("codemirror"))
    .then(() => Promise.all(CODEMIRROR_ADDONS.map((part) => loadScript(codemirrorUrls(part)))))
    .then(
      () => true,
      () => false,
    );
  return editorLibrary;
}

/** Resuelve true si Skulpt quedó disponible. */
export function loadPythonEngine() {
  pythonEngine ??= (
    canCompileCode()
      ? loadScript(skulptUrls("skulpt.min.js"))
          .then(() => loadScript(skulptUrls("skulpt-stdlib.js")))
          .then(() => {
            applySkulptPatches(window.Sk);
            return true;
          })
      : Promise.resolve(false)
  ).then(
    (ready) => (pythonEngineReady = ready),
    () => (pythonEngineReady = false),
  );
  return pythonEngine;
}

/** true/false cuando la carga terminó; undefined mientras sigue cargando. */
export const isPythonEngineReady = () => pythonEngineReady;

/**
 * Skulpt traduce Python a JavaScript y lo evalúa. Si la política de
 * seguridad de la página lo impide, mejor saberlo antes de descargar nada.
 */
function canCompileCode() {
  try {
    return new Function("return true")();
  } catch {
    return false;
  }
}
