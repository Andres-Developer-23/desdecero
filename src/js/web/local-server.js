/*
 * El servidor de Flask del alumno, en http://127.0.0.1:5000.
 *
 * app.run() lo registra con _web.serve() en lugar de quedarse esperando.
 * Desde ese momento, y hasta la siguiente ejecución, la pestaña «web» le
 * envía peticiones: cada una llama a Python (la aplicación de Flask) cuando
 * el motor está libre, y deja en la consola una línea de registro como la
 * del servidor de desarrollo de Flask.
 */

import { TIME_LIMIT_MS } from "../config.js";
import { wait } from "../lib/async.js";
import { callPython } from "../python/engine.js";
import { parseSkulptError } from "../python/errors.js";

/** Cada cuánto se reintenta una petición mientras el motor está ocupado. */
const BUSY_RETRY_MS = 20;
const LOCAL_HOSTNAMES = new Set(["127.0.0.1", "localhost", "0.0.0.0"]);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

let server = null;
let session = { terminal: null, onError: null, timeLimitMs: TIME_LIMIT_MS.lesson };

/**
 * Dónde escribir el registro y los errores del servidor que arranque el
 * programa que va a ejecutarse.
 * @param {{terminal?: object | null, onError?: (error: object) => void, timeLimitMs?: number}} [options]
 */
export function beginServerSession({ terminal = null, onError = null, timeLimitMs } = {}) {
  session = { terminal, onError, timeLimitMs: timeLimitMs ?? TIME_LIMIT_MS.lesson };
}

/** app.run(): el servidor queda en marcha hasta la siguiente ejecución. */
export function startServer(dispatch, host, port) {
  const shown = host === "0.0.0.0" ? "127.0.0.1" : host;
  server = { dispatch, port: Number(port), origin: `http://${shown}:${port}` };
}

/** Detiene el servidor (al empezar otra ejecución). */
export function stopServer() {
  server = null;
}

/** El servidor en marcha, o null. */
export const runningServer = () => (server ? { origin: server.origin } : null);

/** true si la URL apunta al ordenador del alumno (127.0.0.1 o localhost). */
export function isLocalUrl(address) {
  try {
    return LOCAL_HOSTNAMES.has(new URL(address).hostname);
  } catch {
    return false;
  }
}

/** Un error dentro de una vista: se explica en la consola como cualquier otro. */
export function reportServerError(exception) {
  const error = parseSkulptError(exception);
  // La línea, la del código del alumno: no la de dentro del módulo flask.
  const own = (exception?.traceback ?? []).find((frame) => /<stdin>/.test(frame.filename));
  error.line = own?.lineno ?? null;
  session.terminal?.showError(error);
  session.onError?.(error);
}

/**
 * La hora, para los registros: "2026-10-30 19:45:01,123" (la del registro de
 * errores) o "Fri, 30 Oct 2026 19:45:01 GMT" (la cabecera Date).
 */
export function logTime(forErrorLog) {
  const now = new Date();
  const two = (n) => String(n).padStart(2, "0");
  if (forErrorLog) {
    return (
      `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())} ` +
      `${two(now.getHours())}:${two(now.getMinutes())}:${two(now.getSeconds())},` +
      String(now.getMilliseconds()).padStart(3, "0")
    );
  }
  return (
    `${DAYS[now.getUTCDay()]}, ${two(now.getUTCDate())} ${MONTHS[now.getUTCMonth()]} ` +
    `${now.getUTCFullYear()} ${two(now.getUTCHours())}:${two(now.getUTCMinutes())}:` +
    `${two(now.getUTCSeconds())} GMT`
  );
}

function accessTime() {
  const now = new Date();
  const two = (n) => String(n).padStart(2, "0");
  return (
    `${two(now.getDate())}/${MONTHS[now.getMonth()]}/${now.getFullYear()} ` +
    `${two(now.getHours())}:${two(now.getMinutes())}:${two(now.getSeconds())}`
  );
}

function notRunning(host) {
  return {
    error: "host",
    message:
      `No se pudo conectar con ${host}: el servidor no está en marcha. Ejecuta tu programa: ` +
      "app.run() lo arranca, y sigue en marcha hasta la siguiente ejecución.",
  };
}

/**
 * Envía una petición al servidor del alumno y espera la respuesta.
 * @param {{method?: string, url: string, headers?: Record<string, string>, body?: string | null}} request
 * @returns {Promise<import("./internet.js").InternetResponse | {error: string, message: string}>}
 */
export async function requestLocal({ method = "GET", url, headers = {}, body = null }) {
  const parsed = new URL(url);
  const current = server;
  if (!current || Number(parsed.port || 80) !== current.port) return notRunning(parsed.host);
  if (parsed.protocol !== "http:") {
    return {
      error: "url",
      message: "El servidor de desarrollo de Flask usa http://, no https://.",
    };
  }
  method = String(method).toUpperCase();
  let path = parsed.pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    // Se deja tal cual si no es una codificación válida.
  }
  const query = parsed.search.slice(1);
  const sent = { Host: parsed.host, ...headers };

  let result = { status: "busy" };
  while (result.status === "busy") {
    if (server !== current) return notRunning(parsed.host);
    result = await callPython(current.dispatch, [method, path, query, sent, body], {
      onOutput: (text) => session.terminal?.write(text),
      timeLimitMs: session.timeLimitMs,
    });
    if (result.status === "busy") await wait(BUSY_RETRY_MS);
  }

  const target = `${parsed.pathname}${parsed.search}`;
  if (result.status === "error") {
    session.terminal?.showError(result.error);
    session.onError?.(result.error);
    log(method, target, 500);
    return {
      status: 500,
      reason: "INTERNAL SERVER ERROR",
      url: parsed.href,
      headers: [["Content-Type", "text/plain; charset=utf-8"]],
      type: "text/plain; charset=utf-8",
      body: "El servidor falló al atender la petición: mira la consola.",
      redirected: false,
    };
  }

  const answer = result.value;
  log(method, target, answer.status);
  const type = answer.headers.find(([name]) => name.toLowerCase() === "content-type")?.[1] ?? "";
  return {
    status: answer.status,
    reason: answer.status_text.split(" ").slice(1).join(" "),
    url: parsed.href,
    headers: answer.headers,
    type,
    body: answer.body,
    redirected: false,
  };
}

/** La línea que escribe el servidor de desarrollo por cada petición. */
function log(method, target, status) {
  session.terminal?.write(
    `127.0.0.1 - - [${accessTime()}] "${method} ${target} HTTP/1.1" ${status} -\n`,
  );
}
