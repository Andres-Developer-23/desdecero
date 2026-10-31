/*
 * Navegador de los sitios y APIs de práctica (pestaña «web» de las lecciones
 * del simulador web).
 *
 * - Lista las peticiones del último programa (método, estado y URL); al
 *   elegir una, enseña lo que se envió y lo que respondió el servidor.
 * - Las páginas HTML se ven como en un navegador o como su código, que es
 *   lo que recibe requests; el JSON de las APIs, con sangría y colores.
 * - La barra de dirección hace peticiones con cualquier método, datos y
 *   cabeceras, con una sesión aparte: explorar no cambia el estado que vio
 *   el programa. Así se prueba también el servidor de Flask del alumno.
 *
 * Las páginas se dibujan en un iframe sin scripts (sandbox) con srcdoc; las
 * hojas de estilo enlazadas se toman de la misma web de prácticas.
 */

import { escapeHtml } from "../lib/dom.js";
import { highlightHtml, highlightJson } from "./highlight.js";

const MAX_LISTED_REQUESTS = 60;

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const VIEWER_HEADERS = { "User-Agent": "Mozilla/5.0 (navegador de desdecero)", Accept: "*/*" };

/**
 * @param {HTMLElement} host
 * @param {object} options
 * @param {() => ReturnType<import("./internet.js").createInternet>} options.internet
 * @param {(request: object, session: object) => Promise<object>} options.send
 *   Hace una petición de la barra de dirección (runtime.viewerRequest).
 */
export function createWebViewer(host, { internet, send }) {
  host.classList.add("web-viewer");
  host.innerHTML = `
    <div class="web-viewer__requests" hidden>
      <span class="web-viewer__requests-title"></span>
      <ol class="web-viewer__request-list"></ol>
    </div>
    <form class="web-viewer__bar" autocomplete="off" novalidate>
      <button type="button" class="web-viewer__back" aria-label="Página anterior" disabled>←</button>
      <select class="web-viewer__method" aria-label="Método de la petición">
        ${METHODS.map((method) => `<option>${method}</option>`).join("")}
      </select>
      <input class="web-viewer__address" type="url" spellcheck="false" aria-label="Dirección" />
      <button type="submit" class="web-viewer__send">enviar</button>
      <span class="web-viewer__status"></span>
      <div class="web-viewer__modes" role="group" aria-label="Cómo ver la página">
        <button type="button" data-mode="page" aria-pressed="true">página</button>
        <button type="button" data-mode="source" aria-pressed="false">código</button>
      </div>
    </form>
    <details class="web-viewer__compose">
      <summary>datos y cabeceras para enviar</summary>
      <label>
        <span>cabeceras, una por línea (Nombre: valor)</span>
        <textarea class="web-viewer__compose-headers" rows="2" spellcheck="false"
          placeholder="Authorization: Bearer tk-ana-5f2b9c"></textarea>
      </label>
      <label>
        <span>datos (JSON) para POST, PUT y PATCH</span>
        <textarea class="web-viewer__compose-body" rows="3" spellcheck="false"
          placeholder='{"titulo": "Probar mi API"}'></textarea>
      </label>
    </details>
    <details class="web-viewer__details" hidden>
      <summary>cabeceras y datos enviados</summary>
      <div class="web-viewer__exchange"></div>
    </details>
    <div class="web-viewer__view">
      <iframe class="web-viewer__frame" sandbox="allow-same-origin" title="Página de la web de prácticas"></iframe>
      <pre class="web-viewer__source" hidden></pre>
      <p class="web-viewer__empty">Escribe la dirección de un sitio o una API de práctica, o ejecuta tu programa.</p>
    </div>`;

  const parts = {
    requests: host.querySelector(".web-viewer__requests"),
    requestsTitle: host.querySelector(".web-viewer__requests-title"),
    requestList: host.querySelector(".web-viewer__request-list"),
    form: host.querySelector(".web-viewer__bar"),
    back: host.querySelector(".web-viewer__back"),
    method: host.querySelector(".web-viewer__method"),
    address: host.querySelector(".web-viewer__address"),
    composeHeaders: host.querySelector(".web-viewer__compose-headers"),
    composeBody: host.querySelector(".web-viewer__compose-body"),
    status: host.querySelector(".web-viewer__status"),
    modes: host.querySelector(".web-viewer__modes"),
    details: host.querySelector(".web-viewer__details"),
    exchange: host.querySelector(".web-viewer__exchange"),
    frame: host.querySelector(".web-viewer__frame"),
    source: host.querySelector(".web-viewer__source"),
    empty: host.querySelector(".web-viewer__empty"),
  };

  const datalist = document.createElement("datalist");
  datalist.id = `web-viewer-urls-${Math.random().toString(36).slice(2, 8)}`;
  host.appendChild(datalist);
  parts.address.setAttribute("list", datalist.id);

  let mode = "page";
  /** Lo que se ve ahora: {method, url, sent, response, index}. */
  let current = null;
  let recorded = [];
  let session = internet().newSession();
  let ticket = 0;
  const history = [];

  /**
   * Hace una petición desde el navegador (GET si no se indica otra cosa) y
   * enseña la respuesta. Devuelve una promesa que se cumple al enseñarla.
   */
  async function open(url, { remember = true, method = "GET", headers = {}, body = null } = {}) {
    const mine = ++ticket;
    parts.empty.hidden = true;
    parts.address.value = url;
    parts.method.value = method;
    parts.status.textContent = "…";
    delete parts.status.dataset.state;
    const sent = { ...VIEWER_HEADERS, ...headers };
    const response = await send({ method, url, headers: sent, body }, session);
    if (mine !== ticket) return;
    show({ method, url, sent: { headers: sent, body }, response, index: -1 }, { remember });
  }

  /** Enseña una petición del último programa: lo enviado y lo recibido. */
  function showRecorded(index, { remember = true } = {}) {
    const request = recorded[index];
    if (!request) return;
    show(
      {
        method: request.method,
        url: request.url,
        sent: { headers: request.headers, body: request.body },
        response: request.response,
        index,
      },
      { remember },
    );
  }

  function show(exchange, { remember }) {
    ticket++;
    if (remember && current) history.push(current);
    parts.back.disabled = !history.length;
    parts.empty.hidden = true;
    current = exchange;
    const { response } = exchange;

    parts.method.value = METHODS.includes(exchange.method) ? exchange.method : "GET";
    parts.method.dataset.method = exchange.method;
    for (const button of parts.requestList.querySelectorAll("button")) {
      button.classList.toggle("is-current", Number(button.dataset.index) === exchange.index);
    }

    if ("error" in response) {
      parts.address.value = exchange.url;
      parts.status.textContent = "sin conexión";
      parts.status.dataset.state = "error";
      parts.modes.hidden = true;
      parts.details.hidden = true;
      showSource(escapeHtml(response.message));
      return;
    }

    parts.address.value = response.url;
    parts.status.textContent = `${response.status} ${response.reason}`;
    parts.status.dataset.state = response.status < 400 ? "ok" : "error";
    parts.details.hidden = false;
    parts.exchange.innerHTML = describeExchange(exchange);

    const isHtml = response.type.startsWith("text/html") && response.body;
    parts.modes.hidden = !isHtml;
    if (isHtml && mode === "page") showPage(response);
    else showSource(renderBody(response.body, response.type));
  }

  function showPage(response) {
    parts.source.hidden = true;
    parts.frame.hidden = false;
    parts.frame.srcdoc = withInlineStyles(response.body, response.url, internet());
  }

  function showSource(html) {
    parts.frame.hidden = true;
    parts.frame.removeAttribute("srcdoc");
    parts.source.hidden = false;
    parts.source.innerHTML = html;
    parts.source.scrollTop = 0;
  }

  function setMode(next) {
    mode = next;
    for (const button of parts.modes.querySelectorAll("[data-mode]")) {
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    }
    if (current) show(current, { remember: false });
  }

  /**
   * Muestra las peticiones de la última ejecución, y la última de ellas. Si
   * el programa dejó un servidor de Flask en marcha, abre su página
   * (serverUrl, si es de ese servidor, o su raíz).
   */
  function showRun(run, { serverUrl = null } = {}) {
    recorded = run.requests;
    parts.requests.hidden = !recorded.length;
    if (recorded.length) {
      parts.requestsTitle.textContent =
        recorded.length === 1
          ? "tu programa hizo 1 petición:"
          : `tu programa hizo ${recorded.length} peticiones:`;
      const first = Math.max(0, recorded.length - MAX_LISTED_REQUESTS);
      parts.requestList.innerHTML = recorded
        .slice(first)
        .map(
          (request, i) => `<li><button type="button" data-index="${first + i}">
          <span class="web-viewer__time">${request.time.toFixed(1)} s</span>
          <span class="web-viewer__verb" data-method="${escapeHtml(request.method)}">${escapeHtml(request.method)}</span>
          <span class="web-viewer__code" data-state="${request.status < 400 ? "ok" : "error"}">${request.status}</span>
          <span class="web-viewer__url">${escapeHtml(shortUrl(request.url))}</span>
        </button></li>`,
        )
        .join("");
    }
    if (run.server) {
      const url = serverUrl?.startsWith(`${run.server.origin}/`)
        ? serverUrl
        : `${run.server.origin}/`;
      return open(url, { remember: Boolean(current) });
    }
    if (!recorded.length) return Promise.resolve();
    showRecorded(recorded.length - 1);
    parts.requestList.querySelector("li:last-child button")?.scrollIntoView({ block: "nearest" });
    return Promise.resolve();
  }

  /** Cabeceras escritas en el navegador: «Nombre: valor» por línea. */
  function composedHeaders() {
    const headers = {};
    for (const line of parts.composeHeaders.value.split("\n")) {
      const colon = line.indexOf(":");
      if (colon > 0) headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
    }
    return headers;
  }

  parts.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = parts.address.value.trim();
    if (!value) return;
    const method = parts.method.value;
    const headers = composedHeaders();
    let body = null;
    if (method !== "GET" && parts.composeBody.value.trim()) {
      body = parts.composeBody.value;
      const hasType = Object.keys(headers).some((name) => name.toLowerCase() === "content-type");
      if (!hasType)
        headers["Content-Type"] = looksLikeJson(body) ? "application/json" : "text/plain";
    }
    const local = /^(localhost|127\.0\.0\.1)(:|\/|$)/.test(value);
    const url = /^[a-z]+:\/\//i.test(value) ? value : `${local ? "http" : "https"}://${value}`;
    open(url, { method, headers, body });
  });
  parts.method.addEventListener("change", () => {
    parts.method.dataset.method = parts.method.value;
  });
  parts.back.addEventListener("click", () => {
    const previous = history.pop();
    if (previous) show(previous, { remember: false });
    parts.back.disabled = !history.length;
  });
  parts.modes.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (button) setMode(button.dataset.mode);
  });
  parts.requestList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-index]");
    if (button) showRecorded(Number(button.dataset.index));
  });

  // Los enlaces de la página navegan dentro de la web de prácticas.
  parts.frame.addEventListener("load", () => {
    const doc = parts.frame.contentDocument;
    if (!doc || !current) return;
    doc.addEventListener("click", (event) => {
      const link = event.target.closest?.("a[href]");
      if (!link) return;
      event.preventDefault();
      const target = new URL(link.getAttribute("href"), current.response.url);
      if (target.protocol === "http:" || target.protocol === "https:") open(target.href);
    });
  });

  return {
    open,
    showRun,
    /** Prepara el navegador para una lección: sin peticiones y en la página indicada. */
    reset(url) {
      history.length = 0;
      recorded = [];
      session = internet().newSession();
      ticket++;
      parts.back.disabled = true;
      parts.requests.hidden = true;
      parts.requestList.innerHTML = "";
      datalist.innerHTML = internet()
        .urls()
        .map((address) => `<option value="${escapeHtml(address)}"></option>`)
        .join("");
      current = null;
      if (url) open(url, { remember: false });
      else {
        parts.address.value = "";
        parts.status.textContent = "";
        parts.method.value = "GET";
        parts.details.hidden = true;
        parts.frame.hidden = true;
        parts.source.hidden = true;
        parts.empty.hidden = false;
      }
    },
    currentUrl: () => current?.response.url ?? current?.url ?? null,
  };
}

/** El cuerpo de una respuesta o petición: JSON con formato, HTML resaltado o texto. */
function renderBody(body, type = "") {
  if (!body) return '<span class="web-viewer__note">(sin cuerpo)</span>';
  if (type.includes("json") || /^\s*[[{]/.test(body)) {
    const json = highlightJson(body);
    if (json !== null) return json;
  }
  if (type.startsWith("text/html")) return highlightHtml(body);
  return escapeHtml(body);
}

/** Cabeceras enviadas, cuerpo enviado y cabeceras de la respuesta. */
function describeExchange({ method, url, sent, response }) {
  const headers = (pairs) =>
    `<dl class="web-viewer__headers">${pairs
      .map(([name, value]) => `<dt>${escapeHtml(name)}:</dt><dd>${escapeHtml(value)}</dd>`)
      .join("")}</dl>`;
  let html = `<p class="web-viewer__line"><b>${escapeHtml(method)}</b> ${escapeHtml(url)}</p>`;
  if (sent) {
    html += `<h4>cabeceras enviadas</h4>${headers(Object.entries(sent.headers))}`;
    if (sent.body !== null && sent.body !== undefined) {
      const type =
        Object.entries(sent.headers).find(([name]) => name.toLowerCase() === "content-type")?.[1] ??
        "";
      html += `<h4>datos enviados</h4><pre class="web-viewer__sent">${renderBody(sent.body, type)}</pre>`;
    }
  }
  html += `<h4>cabeceras de la respuesta · ${response.status} ${escapeHtml(response.reason)}</h4>`;
  return html + headers(response.headers);
}

/** Sustituye los <link rel="stylesheet"> por el CSS de la web de prácticas. */
function withInlineStyles(html, pageUrl, internet) {
  return html.replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, (tag) => {
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) return "";
    const response = internet.request({ url: new URL(href, pageUrl).href });
    return "error" in response || response.status !== 200 ? "" : `<style>${response.body}</style>`;
  });
}

function looksLikeJson(text) {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

function shortUrl(url) {
  return url.replace(/^https?:\/\//, "");
}
