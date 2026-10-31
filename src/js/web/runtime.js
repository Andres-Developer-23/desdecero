/*
 * Conecta el simulador web (Python, src/python/) con la página: las
 * librerías para hacer scraping y usar APIs.
 *
 * - requests hace las peticiones a los sitios y APIs de práctica
 *   (internet.js) con _web.fetch(). Cada petición queda anotada, con su
 *   respuesta y su hora en un reloj simulado que time.sleep() hace avanzar
 *   sin esperar de verdad.
 * - BeautifulSoup analiza el HTML con el DOMParser del navegador y recorre
 *   en Python el árbol que devuelve _web.parse_html(). select() usa
 *   querySelectorAll sobre ese mismo documento.
 * - open() escribe en un disco simulado.
 * - flask: app.run() deja el servidor del alumno en marcha
 *   (local-server.js) y la pestaña «web» le envía peticiones.
 *
 * Las peticiones, el estado de las APIs, los documentos, el disco y el
 * servidor de Flask se reinician antes de cada ejecución.
 */

import archivosSource from "../../python/_archivos.py";
import bs4Source from "../../python/bs4/__init__.py";
import csvSource from "../../python/csv.py";
import flaskSource from "../../python/flask/__init__.py";
import requestsSource from "../../python/requests/__init__.py";
import requestsExceptionsSource from "../../python/requests/exceptions.py";
import parseSource from "../../python/urllib/parse.py";
import robotparserSource from "../../python/urllib/robotparser.py";
import websimSource from "../../python/websim.py";
import werkzeugSource from "../../python/werkzeug/__init__.py";
import werkzeugExceptionsSource from "../../python/werkzeug/exceptions.py";
import werkzeugHttpSource from "../../python/werkzeug/http.py";
import { createEmitter } from "../lib/events.js";
import { addRunSetup, onRunningChange, registerPythonFiles } from "../python/engine.js";
import { createInternet } from "./internet.js";
import {
  isLocalUrl,
  logTime,
  reportServerError,
  requestLocal,
  runningServer,
  startServer,
  stopServer,
} from "./local-server.js";

export { beginServerSession as beginWebSession } from "./local-server.js";

/** Lo que tarda cada petición en el reloj simulado, en segundos. */
const REQUEST_SECONDS = 0.2;
/** Máximo de peticiones anotadas por ejecución (un bucle sin fin no llena la memoria). */
const MAX_LOGGED_REQUESTS = 500;

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
  expose("api_state", host.apiState);
  expose("file_read", host.fileRead);
  expose("file_write", host.fileWrite);
  expose("file_names", host.fileNames);
  expose("log_time", host.logTime);
  // Estas dos reciben objetos de Python (la aplicación y la excepción) sin convertir.
  mod.serve = new Sk.builtin.func(function (dispatch, address, port) {
    host.serve(dispatch, Sk.ffi.remapToJs(address), Sk.ffi.remapToJs(port));
    return Sk.builtin.none.none$;
  });
  mod.report_error = new Sk.builtin.func(function (exception) {
    host.reportError(exception);
    return Sk.builtin.none.none$;
  });
  return mod;
};
`;

let internet = createInternet();
let virtualFileApi = null;
const emitter = createEmitter();
const state = newState();

function newState() {
  return {
    clock: 0,
    requests: [],
    session: internet.newSession(),
    files: new Map(),
    documents: [],
  };
}

/**
 * Registra los módulos de Python del simulador, la web y las APIs de práctica.
 * Se llama una vez al arrancar.
 * @param {{pages?: Record<string, {type: string, body: string}>, apis?: Record<string, object>}} sources
 */
export function installWebRuntime(sources) {
  internet = createInternet(sources);
  Object.assign(state, newState());

  registerPythonFiles({
    "src/lib/requests/__init__.py": requestsSource,
    "src/lib/requests/exceptions.py": requestsExceptionsSource,
    "src/lib/bs4/__init__.py": bs4Source,
    "src/lib/urllib/parse.py": parseSource,
    "src/lib/urllib/robotparser.py": robotparserSource,
    "src/lib/csv.py": csvSource,
    "src/lib/_archivos.py": archivosSource,
    "src/lib/websim.py": websimSource,
    "src/lib/flask/__init__.py": flaskSource,
    "src/lib/werkzeug/__init__.py": werkzeugSource,
    "src/lib/werkzeug/exceptions.py": werkzeugExceptionsSource,
    "src/lib/werkzeug/http.py": werkzeugHttpSource,
    "src/lib/_web.js": BRIDGE_SOURCE,
  });

  window.__desdeceroWeb = {
    fetch,
    sleep: (seconds) => {
      state.clock += Math.max(0, Number(seconds) || 0);
    },
    parseHtml,
    select,
    requestsLog: () => state.requests.map(toPythonLog),
    apiState: (host) => internet.snapshot(state.session, String(host)),
    fileRead: (name) => (state.files.has(name) ? state.files.get(name) : null),
    fileWrite: (name, text) => {
      state.files.set(name, String(text));
    },
    fileNames: () => [...state.files.keys()],
    logTime,
    serve: startServer,
    reportError: reportServerError,
  };

  addRunSetup(prepareRun);
  onRunningChange((running) => {
    if (!running) emitter.emit("run", lastRun());
  });
}

/** Los sitios y APIs de práctica (para el navegador de la pestaña «web»). */
export const virtualInternet = () => internet;

/**
 * @typedef {object} LoggedRequest
 * @property {string} method
 * @property {string} url URL pedida.
 * @property {string} finalUrl URL después de las redirecciones.
 * @property {Record<string, string>} headers Cabeceras enviadas.
 * @property {string | null} body Cuerpo enviado.
 * @property {number | null} timeout
 * @property {number} time Segundo del reloj simulado en que empezó.
 * @property {number} status
 * @property {import("./internet.js").InternetResponse} response
 */

/**
 * Peticiones, archivos y servidor de Flask de la última ejecución.
 * @returns {{requests: LoggedRequest[], files: Map<string, string>, server: {origin: string} | null}}
 */
export function lastRun() {
  return {
    requests: state.requests.map((request) => ({ ...request })),
    files: new Map(state.files),
    server: runningServer(),
  };
}

/**
 * Las peticiones de la pestaña «web»: van al servidor de Flask del alumno o
 * al internet de prácticas, con la sesión del navegador (no la del programa).
 * @param {{method?: string, url: string, headers?: Record<string, string>, body?: string | null}} request
 * @param {ReturnType<ReturnType<typeof createInternet>["newSession"]>} session
 */
export async function viewerRequest(request, session) {
  if (isLocalUrl(request.url)) return requestLocal(request);
  return internet.request(request, { session });
}

/** Avisa al terminar cada ejecución: listener(lastRun()). */
export const onWebRun = (listener) => emitter.on("run", listener);

/** Antes de cada programa: vacía la web, las APIs y el disco, y pone el open() simulado. */
async function prepareRun(Sk) {
  Object.assign(state, newState());
  stopServer();
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

/** La petición que hace requests: la responde internet.js y queda anotada. */
function fetch(method, url, headers, body, timeout) {
  if (isLocalUrl(String(url))) {
    return {
      error: "host",
      message:
        `No se pudo conectar con ${new URL(String(url)).host}. En tu ordenador, app.run() se ` +
        "queda esperando peticiones y el programa no sigue; aquí, prueba tu servidor desde la " +
        "pestaña web cuando el programa termine, o dentro del programa con app.test_client().",
    };
  }
  const sent = { ...(headers ?? {}) };
  const response = internet.request(
    { method, url: String(url), headers: sent, body: body ?? null },
    { session: state.session, clock: state.clock },
  );
  if ("error" in response) return response;
  if (state.requests.length < MAX_LOGGED_REQUESTS) {
    state.requests.push({
      method: String(method).toUpperCase(),
      url: String(url),
      finalUrl: response.url,
      headers: sent,
      body: body ?? null,
      timeout: timeout ?? null,
      time: Math.round(state.clock * 1000) / 1000,
      status: response.status,
      response,
    });
  }
  state.clock += REQUEST_SECONDS;
  return response;
}

/** Una petición anotada, tal como la ven websim.peticiones() y las comprobaciones. */
function toPythonLog(request) {
  return {
    method: request.method,
    url: request.url,
    status: request.status,
    time: request.time,
    headers: request.headers,
    body: request.body,
    timeout: request.timeout,
  };
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
