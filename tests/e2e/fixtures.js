/*
 * Fixture compartida por las pruebas en navegador.
 *
 * Sirve dist/index.html en una URL ficticia y responde a las peticiones de
 * los CDN con los archivos de node_modules, así las pruebas no dependen de
 * la red y siempre usan las mismas versiones que package.json.
 */

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test as base, expect } from "@playwright/test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PAGE = path.join(ROOT, "dist/index.html");
const MODULES = path.join(ROOT, "node_modules");

/** Traduce una URL de CDN al archivo equivalente dentro de node_modules. */
function localLibraryFile(url) {
  const skulpt = url.match(/\/skulpt@[^/]+\/dist\/(.+)$/);
  if (skulpt) return path.join(MODULES, "skulpt/dist", skulpt[1]);

  const cdnjs = url.match(/\/ajax\/libs\/codemirror\/[^/]+\/(.+)\.min\.js$/);
  if (cdnjs) {
    const part = cdnjs[1] === "codemirror" ? "lib/codemirror" : cdnjs[1];
    return path.join(MODULES, "codemirror", `${part}.js`);
  }

  const jsdelivr = url.match(/\/codemirror@[^/]+\/(.+)$/);
  if (jsdelivr) return path.join(MODULES, "codemirror", jsdelivr[1]);
  return null;
}

/** Hace que la página sirva dist/index.html y las librerías locales. */
export async function servePage(page, baseURL) {
  if (!existsSync(PAGE)) throw new Error("Falta dist/index.html: ejecuta `npm run build`.");
  const html = readFileSync(PAGE);

  await page.route("**/*", async (route) => {
    const url = route.request().url();
    if (url.startsWith(baseURL)) {
      return route.fulfill({ body: html, contentType: "text/html; charset=utf-8" });
    }
    const file = localLibraryFile(url);
    if (file && existsSync(file)) {
      return route.fulfill({ body: readFileSync(file), contentType: "application/javascript" });
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
