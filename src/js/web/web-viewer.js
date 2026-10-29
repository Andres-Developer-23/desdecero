/*
 * Navegador de la web de prácticas (pestaña «web» de las lecciones del
 * simulador web). Enseña las páginas como se verían en un navegador o como su
 * código HTML, que es lo que recibe requests, y lista las peticiones que
 * hizo el último programa.
 *
 * Las páginas se dibujan en un iframe sin scripts (sandbox) con srcdoc; las
 * hojas de estilo enlazadas se toman de la misma web de prácticas.
 */

import { escapeHtml } from "../lib/dom.js";

const MAX_LISTED_REQUESTS = 60;

/**
 * @param {HTMLElement} host
 * @param {{web: () => ReturnType<import("./virtual-web.js").createVirtualWeb>}} options
 */
export function createWebViewer(host, { web }) {
  host.classList.add("web-viewer");
  host.innerHTML = `
    <div class="web-viewer__requests" hidden>
      <span class="web-viewer__requests-title"></span>
      <ol class="web-viewer__request-list"></ol>
    </div>
    <form class="web-viewer__bar" autocomplete="off">
      <button type="button" class="web-viewer__back" aria-label="Página anterior" disabled>←</button>
      <input class="web-viewer__address" type="url" spellcheck="false" aria-label="Dirección" />
      <span class="web-viewer__status"></span>
      <div class="web-viewer__modes" role="group" aria-label="Cómo ver la página">
        <button type="button" data-mode="page" aria-pressed="true">página</button>
        <button type="button" data-mode="source" aria-pressed="false">código</button>
      </div>
    </form>
    <div class="web-viewer__view">
      <iframe class="web-viewer__frame" sandbox="allow-same-origin" title="Página de la web de prácticas"></iframe>
      <pre class="web-viewer__source" hidden></pre>
      <p class="web-viewer__empty">Escribe la dirección de un sitio de práctica o ejecuta tu programa.</p>
    </div>`;

  const parts = {
    requests: host.querySelector(".web-viewer__requests"),
    requestsTitle: host.querySelector(".web-viewer__requests-title"),
    requestList: host.querySelector(".web-viewer__request-list"),
    form: host.querySelector(".web-viewer__bar"),
    back: host.querySelector(".web-viewer__back"),
    address: host.querySelector(".web-viewer__address"),
    status: host.querySelector(".web-viewer__status"),
    modes: host.querySelector(".web-viewer__modes"),
    frame: host.querySelector(".web-viewer__frame"),
    source: host.querySelector(".web-viewer__source"),
    empty: host.querySelector(".web-viewer__empty"),
  };

  const datalist = document.createElement("datalist");
  datalist.id = `web-viewer-urls-${Math.random().toString(36).slice(2, 8)}`;
  host.appendChild(datalist);
  parts.address.setAttribute("list", datalist.id);

  let mode = "page";
  let current = null;
  const history = [];

  function open(url, { remember = true } = {}) {
    const response = web().resolve(url);
    if (remember && current && current.url !== url) history.push(current.url);
    parts.back.disabled = !history.length;
    parts.empty.hidden = true;

    if ("error" in response) {
      current = { url, response: null };
      parts.address.value = url;
      parts.status.textContent = "sin conexión";
      parts.status.dataset.state = "error";
      showSource(response.message);
      return;
    }

    current = { url: response.url, response };
    parts.address.value = response.url;
    parts.status.textContent = `${response.status} ${response.reason}`;
    parts.status.dataset.state = response.status < 400 ? "ok" : "error";
    highlightRequest(response.url);

    const isHtml = response.type.startsWith("text/html");
    parts.modes.hidden = !isHtml;
    if (isHtml && mode === "page") showPage(response);
    else showSource(response.body);
  }

  function showPage(response) {
    parts.source.hidden = true;
    parts.frame.hidden = false;
    parts.frame.srcdoc = withInlineStyles(response.body, response.url, web());
  }

  function showSource(text) {
    parts.frame.hidden = true;
    parts.frame.removeAttribute("srcdoc");
    parts.source.hidden = false;
    parts.source.innerHTML = highlightHtml(text);
    parts.source.scrollTop = 0;
  }

  function setMode(next) {
    mode = next;
    for (const button of parts.modes.querySelectorAll("[data-mode]")) {
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode));
    }
    if (current?.response) open(current.url, { remember: false });
  }

  /** Muestra las peticiones de la última ejecución, y la última página pedida. */
  function showRun(run) {
    const requests = run.requests;
    parts.requests.hidden = !requests.length;
    if (!requests.length) return;
    parts.requestsTitle.textContent =
      requests.length === 1
        ? "tu programa hizo 1 petición:"
        : `tu programa hizo ${requests.length} peticiones:`;
    const listed = requests.slice(-MAX_LISTED_REQUESTS);
    parts.requestList.innerHTML = listed
      .map(
        (request) => `<li><button type="button" data-url="${escapeHtml(request.finalUrl)}">
          <span class="web-viewer__time">${request.time.toFixed(1)} s</span>
          <span class="web-viewer__code" data-state="${request.status < 400 ? "ok" : "error"}">${request.status}</span>
          <span class="web-viewer__url">${escapeHtml(shortUrl(request.url))}</span>
        </button></li>`,
      )
      .join("");
    open(requests.at(-1).finalUrl);
    parts.requestList.querySelector("li:last-child button")?.scrollIntoView({ block: "nearest" });
  }

  function highlightRequest(url) {
    for (const button of parts.requestList.querySelectorAll("button")) {
      button.classList.toggle("is-current", button.dataset.url === url);
    }
  }

  parts.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = parts.address.value.trim();
    if (value) open(/^[a-z]+:\/\//i.test(value) ? value : `https://${value}`);
  });
  parts.back.addEventListener("click", () => {
    const previous = history.pop();
    if (previous) open(previous, { remember: false });
    parts.back.disabled = !history.length;
  });
  parts.modes.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (button) setMode(button.dataset.mode);
  });
  parts.requestList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-url]");
    if (button) open(button.dataset.url);
  });

  // Los enlaces de la página navegan dentro de la web de prácticas.
  parts.frame.addEventListener("load", () => {
    const doc = parts.frame.contentDocument;
    if (!doc || !current) return;
    doc.addEventListener("click", (event) => {
      const link = event.target.closest?.("a[href]");
      if (!link) return;
      event.preventDefault();
      const target = new URL(link.getAttribute("href"), current.url);
      if (target.protocol === "http:" || target.protocol === "https:") open(target.href);
    });
  });

  return {
    open,
    showRun,
    /** Prepara el navegador para una lección: sin peticiones y en la página indicada. */
    reset(url) {
      history.length = 0;
      parts.requests.hidden = true;
      parts.requestList.innerHTML = "";
      datalist.innerHTML = web()
        .urls()
        .map((address) => `<option value="${escapeHtml(address)}"></option>`)
        .join("");
      current = null;
      if (url) open(url, { remember: false });
      else {
        parts.address.value = "";
        parts.status.textContent = "";
        parts.frame.hidden = true;
        parts.source.hidden = true;
        parts.empty.hidden = false;
      }
    },
    currentUrl: () => current?.url ?? null,
  };
}

/** Sustituye los <link rel="stylesheet"> por el CSS de la web de prácticas. */
function withInlineStyles(html, pageUrl, web) {
  return html.replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, (tag) => {
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) return "";
    const response = web.resolve(new URL(href, pageUrl).href);
    return "error" in response || response.status !== 200 ? "" : `<style>${response.body}</style>`;
  });
}

function shortUrl(url) {
  return url.replace(/^https?:\/\//, "");
}

/** Resaltado sencillo de HTML: etiquetas, atributos, valores y comentarios. */
export function highlightHtml(source) {
  return escapeHtml(source)
    .replace(/&lt;!--[\s\S]*?--&gt;/g, (comment) => `<span class="hl-comment">${comment}</span>`)
    .replace(
      /(&lt;\/?)([a-zA-Z][\w-]*)([^]*?)(\/?&gt;)/g,
      (match, open, name, attributes, close) =>
        `${open}<span class="hl-tag">${name}</span>${attributes.replace(
          /([\w:-]+)(=)(&quot;[^]*?&quot;|&#39;[^]*?&#39;|[^\s&]+)/g,
          '<span class="hl-attr">$1</span>$2<span class="hl-value">$3</span>',
        )}${close}`,
    );
}
