/*
 * La web de prácticas: los archivos de content/web/ servidos como si
 * fueran sitios de verdad. Decide qué responde cada URL (página, redirección
 * o error 404) sin salir a internet.
 *
 * No depende del navegador: se prueba en tests/unit.
 */

const REASONS = {
  200: "OK",
  301: "Moved Permanently",
  403: "Forbidden",
  404: "Not Found",
  500: "Internal Server Error",
};

const NOT_FOUND_BODY = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>404 · Página no encontrada</title></head>
<body><h1>404</h1><p>Esta página no existe.</p></body>
</html>
`;

/**
 * @typedef {{type: string, body: string}} WebFile
 * @typedef {object} WebResponse
 * @property {number} status
 * @property {string} reason
 * @property {string} url URL final, después de seguir las redirecciones.
 * @property {string} type Content-Type.
 * @property {string} body
 * @property {boolean} redirected
 */

/**
 * @param {Record<string, WebFile>} pages Archivos por URL absoluta (https://sitio.example/ruta).
 */
export function createVirtualWeb(pages) {
  const files = new Map();
  for (const [url, file] of Object.entries(pages ?? {})) files.set(normalize(url) ?? url, file);
  const hosts = [...new Set([...files.keys()].map((url) => new URL(url).host))].sort();

  /**
   * Responde a una petición GET.
   * @param {string} address
   * @returns {WebResponse | {error: "url" | "host", message: string}}
   */
  function resolve(address) {
    let url;
    try {
      url = new URL(address);
    } catch {
      return { error: "url", message: "la dirección no es una URL válida" };
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { error: "url", message: "solo se admiten direcciones http:// y https://" };
    }
    if (!hosts.includes(url.host)) {
      return {
        error: "host",
        message:
          `No se pudo conectar con ${url.host}. El simulador del curso solo puede visitar ` +
          `los sitios de práctica: ${hosts.join(", ")}. En tu ordenador, requests puede ` +
          "visitar cualquier web.",
      };
    }

    // http:// y las carpetas sin barra final redirigen, como en un servidor real.
    let redirected = url.protocol === "http:";
    url.protocol = "https:";
    url.hash = "";
    if (!files.has(url.href) && !url.pathname.endsWith("/") && !url.search) {
      const folder = new URL(url.href);
      folder.pathname += "/";
      if (files.has(indexOf(folder))) {
        url = folder;
        redirected = true;
      }
    }

    const file =
      files.get(url.href) ?? (url.pathname.endsWith("/") ? files.get(indexOf(url)) : null);
    if (file) return response(200, url.href, file, redirected);
    const notFound = files.get(`https://${url.host}/404.html`);
    return response(
      404,
      url.href,
      notFound ?? { type: "text/html; charset=utf-8", body: NOT_FOUND_BODY },
      redirected,
    );
  }

  return {
    hosts: () => [...hosts],
    /** Todas las páginas, en orden alfabético; los index.html, con la URL de su carpeta. */
    urls: () => [...files.keys()].map((url) => url.replace(/\/index\.html$/, "/")).sort(),
    has: (url) => !("error" in resolve(url)) && resolve(url).status === 200,
    resolve,
  };
}

/** URL del index.html de una carpeta. */
function indexOf(url) {
  const index = new URL(url.href);
  index.pathname += "index.html";
  return index.href;
}

function response(status, url, file, redirected) {
  return {
    status,
    reason: REASONS[status] ?? "",
    url,
    type: file.type,
    body: file.body,
    redirected,
  };
}

/** Forma canónica de una URL (la misma que produce new URL), o null si no es válida. */
export function normalize(address) {
  try {
    const url = new URL(address);
    url.hash = "";
    return url.href;
  } catch {
    return null;
  }
}
