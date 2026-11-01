/*
 * Carga bajo demanda de sql.js: SQLite compilado a WebAssembly. Se carga
 * una sola vez, la primera vez que un programa usa sqlite3 (o que se abre
 * la pestaña «datos»).
 */

import { sqlJsBaseUrls } from "../config.js";
import { loadScript } from "../lib/load-script.js";

let engine = null;

/** Resuelve el módulo de sql.js (con SQL.Database), o null si no se pudo cargar. */
export function loadSqlEngine() {
  engine ??= (async () => {
    for (const base of sqlJsBaseUrls()) {
      try {
        if (typeof window.initSqlJs !== "function") await loadScript([`${base}sql-wasm.js`]);
        return await window.initSqlJs({ locateFile: (file) => `${base}${file}` });
      } catch {
        // Se prueba con el siguiente CDN.
      }
    }
    return null;
  })();
  return engine;
}
