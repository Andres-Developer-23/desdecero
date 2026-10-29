/*
 * Conecta el simulador web (Python, src/python/) con la página: las
 * librerías para hacer scraping y usar APIs.
 *
 * - requests pide las páginas a la web de prácticas (web.js) con
 *   _web.fetch(). Cada petición queda anotada con su hora en un reloj
 *   simulado, que time.sleep() hace avanzar sin esperar de verdad.
 * - BeautifulSoup analiza el HTML con el DOMParser del navegador y recorre
 *   en Python el árbol que devuelve _web.parse_html(). select() usa
 *   querySelectorAll sobre ese mismo documento.
 * - open() escribe en un disco simulado.
 *
 * Las peticiones, los documentos y el disco se vacían antes de cada ejecución.
 */

import archivosSource from "../../python/_archivos.py";
import bs4Source from "../../python/bs4/__init__.py";
import csvSource from "../../python/csv.py";
import requestsSource from "../../python/requests/__init__.py";
import requestsExceptionsSource from "../../python/requests/exceptions.py";
import parseSource from "../../python/urllib/parse.py";
import robotparserSource from "../../python/urllib/robotparser.py";
import websimSource from "../../python/websim.py";
import { createEmitter } from "../lib/events.js";
import { addRunSetup, onRunningChange, registerPythonFiles } from "../python/engine.js";
import { createVirtualWeb } from "./virtual-web.js";

/** Lo que tarda cada petición en el reloj simulado, en segundos. */
const REQUEST_SECONDS = 0.2;

/*
 * Módulo nativo de Skulpt que hace de puente con JavaScript ("import _web").
 * Convierte los argumentos a JavaScript y los resultados a Python.
 */
const BRIDGE_SOURCE = `
var $builtinmodule = function (name) {
  var host = window.__desdeceroWeb;
  var js = function (value) { return value === undefined ? undefined : Sk.ffi.remapToJs(value); };
  var py = function (value) {
    return value === null || value === undefined ? Sk.builtin.none.none$ : Sk.ffi.remapToPy(value);
  };
  var mod = { __name__: new Sk.builtin.str("_web") };
  var expose = function (pyName, fn) {
    mod[pyName] = new Sk.builtin.func(function () {
      var args = Array.prototype.map.call(arguments, js);
      return py(fn.apply(null, args));
    });
  };
  expose("fetch", host.fetch);
  expose("sleep", host.sleep);
  expose("parse_html", host.parseHtml);
  expose("select", host.select);
  expose("requests_log", host.requestsLog);
  expose("file_read", host.fileRead);
  expose("file_write", host.fileWrite);
  expose("file_names", host.fileNames);
  return mod;
};
`;

let web = createVirtualWeb({});
let virtualFileApi = null;
const emitter = createEmitter();
const state = newState();

function newState() {
  return { clock: 0, requests: [], files: new Map(), documents: [] };
}

/**
 * Registra los módulos de Python del simulador y la web de prácticas.
 * Se llama una vez al arrancar.
 * @param {Record<string, {type: string, body: string}>} pages
 */
export function installWebRuntime(pages) {
  web = createVirtualWeb(pages);

  registerPythonFiles({
    "src/lib/requests/__init__.py": requestsSource,
    "src/lib/requests/exceptions.py": requestsExceptionsSource,
    "src/lib/bs4/__init__.py": bs4Source,
    "src/lib/urllib/parse.py": parseSource,
    "src/lib/urllib/robotparser.py": robotparserSource,
    "src/lib/csv.py": csvSource,
    "src/lib/_archivos.py": archivosSource,
    "src/lib/websim.py": websimSource,
    "src/lib/_web.js": BRIDGE_SOURCE,
  });

  window.__desdeceroWeb = {
    fetch,
    sleep: (seconds) => {
      state.clock += Math.max(0, Number(seconds) || 0);
    },
    parseHtml,
    select,
    requestsLog: () => state.requests.map((request) => ({ ...request })),
    fileRead: (name) => (state.files.has(name) ? state.files.get(name) : null),
    fileWrite: (name, text) => {
      state.files.set(name, String(text));
    },
    fileNames: () => [...state.files.keys()],
  };

  addRunSetup(prepareRun);
  onRunningChange((running) => {
    if (!running) emitter.emit("run", lastRun());
  });
}

/** La web de prácticas (para el navegador de la pestaña «web»). */
export const virtualWeb = () => web;

/**
 * Peticiones y archivos de la última ejecución.
 * @returns {{requests: Array<{url: string, finalUrl: string, status: number, time: number}>, files: Map<string, string>}}
 */
export function lastRun() {
  return {
    requests: state.requests.map((request) => ({ ...request })),
    files: new Map(state.files),
  };
}

/** Avisa al terminar cada ejecución: listener(lastRun()). */
export const onWebRun = (listener) => emitter.on("run", listener);

/** Antes de cada programa: vacía la web y el disco, y pone el open() simulado. */
async function prepareRun(Sk) {
  Object.assign(state, newState());
  if (!virtualFileApi) {
    const module = await Sk.misceval.asyncToPromise(() =>
      Sk.importModule("_archivos", false, true),
    );
    const attr = (name) => Sk.abstr.gattr(module, new Sk.builtin.str(name));
    virtualFileApi = {
      open: attr("open"),
      FileNotFoundError: attr("FileNotFoundError"),
      FileExistsError: attr("FileExistsError"),
    };
  }
  Object.assign(Sk.builtins, virtualFileApi, { OSError: Sk.builtin.IOError });
}

function fetch(url, headers) {
  const result = web.resolve(String(url));
  if ("error" in result) return result;
  state.requests.push({
    url: String(url),
    finalUrl: result.url,
    status: result.status,
    time: Math.round(state.clock * 1000) / 1000,
    headers: { ...(headers ?? {}) },
  });
  state.clock += REQUEST_SECONDS;
  return result;
}

/* ---- HTML: del DOMParser a un árbol que BeautifulSoup recorre en Python ---- */

/**
 * Analiza el HTML y devuelve {doc, roots}. Cada elemento lleva su índice
 * (i) en el documento, que select() usa para encontrarlo después.
 */
function parseHtml(text) {
  const doc = new DOMParser().parseFromString(String(text), "text/html");
  const elements = [];
  const indexOf = new Map();

  const toTree = (node) => {
    switch (node.nodeType) {
      case Node.ELEMENT_NODE: {
        const index = elements.push(node) - 1;
        indexOf.set(node, index);
        const children = node.localName === "template" ? node.content.childNodes : node.childNodes;
        return {
          k: "t",
          n: node.localName.toLowerCase(),
          i: index,
          a: [...node.attributes].map((attribute) => [attribute.name, attribute.value]),
          c: [...children].map(toTree).filter((child) => child !== null),
        };
      }
      case Node.TEXT_NODE:
      case Node.CDATA_SECTION_NODE:
        return node.data;
      case Node.COMMENT_NODE:
        return { k: "c", v: node.data };
      case Node.DOCUMENT_TYPE_NODE:
        return { k: "d", v: node.name };
      default:
        return null;
    }
  };

  // Como html.parser, un fragmento ("<p>hola</p>") no gana <html>, <head> ni <body>.
  const isDocument = /<html[\s>]|<!doctype/i.test(text);
  const roots = isDocument ? [...doc.childNodes] : [...doc.head.childNodes, ...doc.body.childNodes];
  const id = state.documents.push({ doc, elements, indexOf }) - 1;
  return { doc: id, roots: roots.map(toTree).filter((root) => root !== null) };
}

/** Índices de los elementos que coinciden con el selector, o null si no es válido. */
function select(docId, nodeIndex, selector, limit) {
  const entry = state.documents[docId];
  if (!entry) return [];
  const scope = nodeIndex < 0 ? entry.doc : entry.elements[nodeIndex];
  let found;
  try {
    found = scope.querySelectorAll(selector);
  } catch {
    return null;
  }
  const result = [];
  for (const element of found) {
    const index = entry.indexOf.get(element);
    if (index === undefined) continue;
    result.push(index);
    if (limit && result.length >= limit) break;
  }
  return result;
}
