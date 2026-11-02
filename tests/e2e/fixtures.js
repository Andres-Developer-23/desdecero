/*
 * Fixture compartida por las pruebas en navegador.
 *
 * Sirve dist/index.html en una URL ficticia y responde a las peticiones de
 * los CDN con los archivos de node_modules, así las pruebas no dependen de
 * la red y siempre usan las mismas versiones que package.json. Pyodide se
 * sirve desde .cache/pyodide (lo prepara scripts/download-pyodide.js).
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as base, expect } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PAGE = path.join(ROOT, "dist/index.html");
const MODULES = path.join(ROOT, "node_modules");
const PYODIDE = path.join(ROOT, ".cache/pyodide");

const CONTENT_TYPES = {
  ".wasm": "application/wasm",
  ".json": "application/json",
  ".zip": "application/zip",
  ".whl": "application/zip",
};

/** Traduce una URL de CDN al archivo equivalente dentro de node_modules. */
function localLibraryFile(url) {
  const skulpt = url.match(/\/skulpt@[^/]+\/dist\/(.+)$/);
  if (skulpt) return path.join(MODULES, "skulpt/dist", skulpt[1]);

  const cdnjs = url.match(/\/ajax\/libs\/codemirror\/[^/]+\/(.+)\.min\.js$/);
  if (cdnjs) {
    const part = cdnjs[1] === "codemirror" ? "lib/codemirror" : cdnjs[1];
    return path.join(MODULES, "codemirror", `${part}.js`);
  }

  const sqljs = url.match(/\/sql\.js@[^/]+\/dist\/(.+)$/);
  if (sqljs) return path.join(MODULES, "sql.js/dist", sqljs[1]);

  const jsdelivr = url.match(/\/codemirror@[^/]+\/(.+)$/);
  if (jsdelivr) return path.join(MODULES, "codemirror", jsdelivr[1]);

  const pyodide = url.match(/\/pyodide\/v([^/]+)\/full\/([^?]+)$/);
  if (pyodide) return path.join(PYODIDE, pyodide[1], pyodide[2]);
  return null;
}

/** Hace que la página sirva dist/index.html y las librerías locales. */
export async function servePage(page, baseURL) {
  if (!existsSync(PAGE)) throw new Error("Falta dist/index.html: ejecuta `npm run build`.");
  const html = readFileSync(PAGE);

  // En el contexto, no en la página: así también se sirven las peticiones del worker de Pyodide.
  await page.context().route("**/*", async (route) => {
    const url = route.request().url();
    if (url.startsWith(baseURL)) {
      return route.fulfill({ body: html, contentType: "text/html; charset=utf-8" });
    }
    const file = localLibraryFile(url);
    if (file && existsSync(file)) {
      const contentType = CONTENT_TYPES[path.extname(file)] ?? "application/javascript";
      // Pyodide se pide desde un Web Worker con fetch(): necesita la cabecera de CORS.
      const headers = { "Access-Control-Allow-Origin": "*" };
      return route.fulfill({ body: readFileSync(file), contentType, headers });
    }
    if (file?.startsWith(PYODIDE)) {
      console.error(`Falta ${file}: ejecuta «node scripts/download-pyodide.js».`);
    }
    return route.abort(); // fuentes y cualquier otra cosa externa
  });
}

export const test = base.extend({
  page: async ({ page, baseURL }, use) => {
    await servePage(page, baseURL);
    await use(page);
  },
});

/** Abre la página y espera a que el motor de Python esté listo. */
export async function openApp(page, hash = "") {
  await page.goto(`/${hash}`);
  await expect(page.locator("[data-engine-status]").first()).toHaveText("python 3 · listo", {
    timeout: 30_000,
  });
}

export { expect };
