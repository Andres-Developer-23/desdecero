/*
 * El «internet» del simulador web: los sitios de práctica (virtual-web.js)
 * y las APIs de práctica (apis/) detrás de una sola función request().
 *
 * Las APIs guardan estado (las tareas creadas, las peticiones que cuentan
 * para el límite...) en una sesión. El simulador crea una sesión nueva en
 * cada ejecución; el navegador de la pestaña «web» usa una desechable para
 * no alterar la del programa.
 *
 * No depende del navegador: se prueba en tests/unit.
 */

import { createApis } from "./apis/index.js";
import { REASONS } from "./apis/server.js";
import { createVirtualWeb } from "./virtual-web.js";

const METHOD_NOT_ALLOWED_BODY = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>405 · Método no permitido</title></head>
<body><h1>405</h1><p>Este sitio solo admite GET: es una web de páginas, no una API.</p></body>
</html>
`;

/**
 * @typedef {object} InternetResponse
 * @property {number} status
 * @property {string} reason
 * @property {string} url URL final, después de seguir las redirecciones.
 * @property {Array<[string, string]>} headers
 * @property {string} type Content-Type ("" si la respuesta no tiene cuerpo).
 * @property {string} body
 * @property {boolean} redirected
 */

/**
 * @param {{pages?: Record<string, {type: string, body: string}>, apis?: Record<string, object>}} sources
 */
export function createInternet({ pages = {}, apis = {} } = {}) {
  const web = createVirtualWeb(pages);
  const servers = new Map(createApis(apis).map((api) => [api.host, api]));
  const hosts = [...new Set([...web.hosts(), ...servers.keys()])].sort();

  /** Estado de las APIs durante una ejecución. */
  const newSession = () => ({ states: new Map() });

  /**
   * Hace una petición.
   * @param {{method?: string, url: string, headers?: Record<string, string>, body?: string | null}} request
   * @param {{session?: ReturnType<typeof newSession>, clock?: number}} [options]
   * @returns {InternetResponse | {error: "url" | "host", message: string}}
   */
  function request({ method = "GET", url, headers = {}, body = null }, options = {}) {
    const { session = newSession(), clock = 0 } = options;
    method = String(method).toUpperCase();
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return { error: "url", message: "la dirección no es una URL válida" };
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { error: "url", message: "solo se admiten direcciones http:// y https://" };
    }
    if (!hosts.includes(parsed.host)) {
      return {
        error: "host",
        message:
          `No se pudo conectar con ${parsed.host}. El simulador del curso solo puede visitar ` +
          `los sitios de práctica: ${hosts.join(", ")}. En tu ordenador, requests puede ` +
          "visitar cualquier web.",
      };
    }

    const server = servers.get(parsed.host);
    if (!server) return staticResponse(method, parsed.href);

    const redirected = parsed.protocol === "http:";
    parsed.protocol = "https:";
    parsed.hash = "";
    if (!session.states.has(server.host)) session.states.set(server.host, server.initialState());
    const lowerHeaders = new Map(
      Object.entries(headers).map(([name, value]) => [name.toLowerCase(), String(value)]),
    );
    const response = server.handle(
      { method, url: parsed, headers: lowerHeaders, body },
      { clock: Math.round(clock * 1000) / 1000, state: session.states.get(server.host) },
    );
    return finish(response.status, parsed.href, response.headers, response.body, redirected);
  }

  function staticResponse(method, url) {
    if (method !== "GET" && method !== "HEAD") {
      return finish(
        405,
        url,
        { "Content-Type": "text/html; charset=utf-8", Allow: "GET, HEAD" },
        METHOD_NOT_ALLOWED_BODY,
        false,
      );
    }
    const page = web.resolve(url);
    const body = method === "HEAD" ? "" : page.body;
    return finish(page.status, page.url, { "Content-Type": page.type }, body, page.redirected, {
      length: byteLength(page.body),
    });
  }

  return {
    request,
    newSession,
    hosts: () => [...hosts],
    /** Direcciones que sugiere el navegador: las páginas y algunas rutas de cada API. */
    urls: () => [...web.urls(), ...[...servers.values()].flatMap((api) => api.examples)].sort(),
    /** El estado de una API en una sesión, para las comprobaciones (websim.estado_api). */
    snapshot(session, host) {
      const server = servers.get(host);
      if (!server) return null;
      if (!session.states.has(host)) session.states.set(host, server.initialState());
      return server.snapshot(session.states.get(host));
    },
  };
}

function finish(status, url, headers, body, redirected, { length } = {}) {
  const list = Object.entries(headers);
  if (status !== 204) list.push(["Content-Length", String(length ?? byteLength(body))]);
  return {
    status,
    reason: REASONS[status] ?? "",
    url,
    headers: list,
    type: headers["Content-Type"] ?? "",
    body,
    redirected,
  };
}

const encoder = new TextEncoder();
const byteLength = (text) => encoder.encode(text).length;
