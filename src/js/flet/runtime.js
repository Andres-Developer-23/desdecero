/*
 * Conecta el simulador de Flet (Python, src/python/) con la página.
 *
 * Cada ejecución de un programa abre una "sesión" con su vista previa y su
 * terminal. Python envía el árbol de controles con _flet_bridge.render() y
 * la vista previa avisa de los eventos, que se atienden con callPython().
 * Al empezar otra ejecución, la vista previa anterior se detiene.
 */

import dataclassesSource from "../../python/dataclasses.py";
import fletSource from "../../python/flet/__init__.py";
import fletsimSource from "../../python/fletsim.py";
import typingSource from "../../python/typing.py";
import { TIME_LIMIT_MS } from "../config.js";
import { callPython, registerPythonFiles } from "../python/engine.js";

/*
 * Módulo nativo de Skulpt que hace de puente con JavaScript. Skulpt evalúa
 * este texto al hacer "import _flet_bridge".
 */
const BRIDGE_SOURCE = `
var $builtinmodule = function (name) {
  var host = window.__desdeceroFlet;
  var mod = { __name__: new Sk.builtin.str("_flet_bridge") };
  mod.render = new Sk.builtin.func(function (tree) {
    host.render(Sk.ffi.remapToJs(tree));
    return Sk.builtin.none.none$;
  });
  mod.attach = new Sk.builtin.func(function (dispatch) {
    host.attach(dispatch);
    return Sk.builtin.none.none$;
  });
  mod.accepts_argument = new Sk.builtin.func(function (fn) {
    return host.acceptsArgument(fn) ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$;
  });
  return mod;
};
`;

let current = null;
let nextSessionId = 1;

/** Registra los módulos de Python del simulador y el puente. Se llama una vez al arrancar. */
export function installFletRuntime() {
  registerPythonFiles({
    "src/lib/flet/__init__.py": fletSource,
    "src/lib/fletsim.py": fletsimSource,
    "src/lib/dataclasses.py": dataclassesSource,
    "src/lib/typing.py": typingSource,
    "src/lib/_flet_bridge.js": BRIDGE_SOURCE,
  });

  window.__desdeceroFlet = {
    render(tree) {
      if (!current) return;
      current.rendered = true;
      current.renderer?.render(tree);
    },
    attach(dispatch) {
      if (current) current.dispatch = dispatch;
    },
    acceptsArgument,
  };
}

export { usesFlet } from "./detect.js";

/**
 * Empieza una sesión nueva antes de ejecutar un programa.
 * @param {object} options
 * @param {ReturnType<import("./renderer.js").createFletRenderer> | null} [options.renderer]
 *   Dónde dibujar la app; null para ejecuciones sin vista previa (comprobaciones).
 * @param {ReturnType<import("../ui/terminal.js").createTerminal> | null} [options.terminal]
 *   Dónde mostrar los print() y los errores de los manejadores de eventos.
 * @param {(error: object) => void} [options.onError]
 * @param {number} [options.timeLimitMs]
 * @returns {{id: number, rendered: boolean}} La sesión; "rendered" indica si la app llegó a dibujarse.
 */
export function beginFletSession({ renderer = null, terminal = null, onError, timeLimitMs } = {}) {
  if (current?.renderer && current.renderer !== renderer) current.renderer.detach();
  current = {
    id: nextSessionId++,
    renderer,
    terminal,
    onError,
    timeLimitMs: timeLimitMs ?? TIME_LIMIT_MS.lesson,
    dispatch: null,
    rendered: false,
    queue: Promise.resolve(),
  };
  renderer?.start(current.id);
  return current;
}

/** Evento de la vista previa: lo atiende Python, en orden y de uno en uno. */
export function sendFletEvent(sessionId, uid, name, data = null) {
  const session = current;
  if (!session || session.id !== sessionId || !session.dispatch) return;
  session.queue = session.queue.then(async () => {
    if (current !== session) return;
    const result = await callPython(session.dispatch, [uid, name, data], {
      onOutput: (text) => session.terminal?.write(text),
      timeLimitMs: session.timeLimitMs,
    });
    if (result.status === "error") {
      session.terminal?.showError(result.error);
      session.onError?.(result.error);
    }
  });
}

/**
 * Cuántos argumentos acepta un manejador: en Flet 1.0 puede definirse con
 * el evento (def clic(e)) o sin él (def clic()).
 */
function acceptsArgument(fn) {
  const target = fn.im_func ?? fn;
  const names = target.co_varnames;
  if (!Array.isArray(names) || target.co_varargs) return true;
  const count = names.length - (fn.im_self ? 1 : 0);
  return count >= 1;
}
