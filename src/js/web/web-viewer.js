/*
 * Navegador de los sitios y APIs de práctica (pestaña «web» de las lecciones
 * del simulador web).
 *
 * - Lista las peticiones del último programa (método, estado y URL); al
 *   elegir una, enseña lo que se envió y lo que respondió el servidor.
 * - Las páginas HTML se ven como en un navegador o como su código, que es
 *   lo que recibe requests; el JSON de las APIs, con sangría y colores.
 * - La barra de dirección hace peticiones GET con una sesión aparte, así
 *   que explorar no cambia el estado que vio el programa.
 *
 * Las páginas se dibujan en un iframe sin scripts (sandbox) con srcdoc; las
 * hojas de estilo enlazadas se toman de la misma web de prácticas.
 */

import { escapeHtml } from "../lib/dom.js";
import { highlightHtml, highlightJson } from "./highlight.js";

const MAX_LISTED_REQUESTS = 60;

/**
 * @param {HTMLElement} host
 * @param {{internet: () => ReturnType<import("./internet.js").createInternet>}} options
 */
export function createWebViewer(host, { internet }) {
  host.classList.add("web-viewer");
  host.innerHTML = `
    <div class="web-viewer__requests" hidden>
      <span class="web-viewer__requests-title"></span>
      <ol class="web-viewer__request-list"></ol>
    </div>
    <form class="web-viewer__bar" autocomplete="off">
      <button type="button" class="web-viewer__back" aria-label="Página anterior" disabled>←</button>
      <span class="web-viewer__method" hidden></span>
      <input class="web-viewer__address" type="url" spellcheck="false" aria-label="Dirección" />
      <span class="web-viewer__status"></span>
      <div class="web-viewer__modes" role="group" aria-label="Cómo ver la página">
        <button type="button" data-mode="page" aria-pressed="true">página</button>
        <button type="button" data-mode="source" aria-pressed="false">código</button>
      </div>
    </form>
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
  const history = [];

  /** Pide una dirección con GET (sesión aparte) y la enseña. */
  function open(url, { remember = true } = {}) {
    const response = internet().request({ method: "GET", url });
    show({ method: "GET", url, sent: null, response, index: -1 }, { remember });
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
    if (remember && current) history.push(current);
    parts.back.disabled = !history.length;
    parts.empty.hidden = true;
    current = exchange;
    const { response } = exchange;

    parts.method.hidden = exchange.method === "GET";
    parts.method.textContent = exchange.method;
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

  /** Muestra las peticiones de la última ejecución, y la última de ellas. */
  function showRun(run) {
    recorded = run.requests;
    parts.requests.hidden = !recorded.length;
    if (!recorded.length) return;
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
    showRecorded(recorded.length - 1);
    parts.requestList.querySelector("li:last-child button")?.scrollIntoView({ block: "nearest" });
  }

  parts.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = parts.address.value.trim();
    if (value) open(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`);
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
        parts.method.hidden = true;
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

function shortUrl(url) {
  return url.replace(/^https?:\/\//, "");
}
