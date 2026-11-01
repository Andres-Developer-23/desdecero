#!/usr/bin/env node
/*
 * Descarga Pyodide para las pruebas en navegador, que lo sirven en local en
 * lugar de pedirlo al CDN (como hacen con Skulpt y sql.js desde node_modules).
 *
 * El paquete pyodide de npm solo trae el núcleo: pandas, numpy y matplotlib
 * vienen en la distribución completa, que se publica en las releases de
 * GitHub. Se guardan en .cache/pyodide/<versión>/ el núcleo y los paquetes
 * que usa el curso con sus dependencias (unos 30 MB).
 *
 *   node scripts/download-pyodide.js [pyodide-<versión>.tar.bz2]
 *
 * Con un archivo .tar.bz2 ya descargado, no se descarga de nuevo.
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
const VERSION = pkg.devDependencies.pyodide;
const TARGET = path.join(ROOT, ".cache/pyodide", VERSION);
/** Los paquetes que pueden importar los programas (como PYODIDE_PACKAGES en src/js/config.js). */
const PACKAGES = ["numpy", "pandas", "matplotlib"];
const CORE = [
  "pyodide.js",
  "pyodide.mjs",
  "pyodide.asm.mjs",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
];

if (existsSync(path.join(TARGET, ".completo"))) {
  console.log(`Pyodide ${VERSION} ya está en ${path.relative(ROOT, TARGET)}`);
  process.exit(0);
}

const work = mkdtempSync(path.join(tmpdir(), "pyodide-"));
try {
  let archive = process.argv[2];
  if (!archive) {
    archive = path.join(work, `pyodide-${VERSION}.tar.bz2`);
    const url = `https://github.com/pyodide/pyodide/releases/download/${VERSION}/pyodide-${VERSION}.tar.bz2`;
    console.log(`Descargando ${url}…`);
    execFileSync("curl", ["--fail", "--location", "--silent", "--show-error", "-o", archive, url], {
      stdio: "inherit",
    });
  }
  console.log("Descomprimiendo…");
  execFileSync("tar", ["-xjf", archive, "-C", work], { stdio: "inherit" });
  const source = path.join(work, "pyodide");

  const lock = JSON.parse(readFileSync(path.join(source, "pyodide-lock.json"), "utf8"));
  const needed = new Set();
  const visit = (name) => {
    if (needed.has(name)) return;
    needed.add(name);
    for (const dependency of lock.packages[name].depends) visit(dependency);
  };
  PACKAGES.forEach(visit);

  rmSync(TARGET, { recursive: true, force: true });
  mkdirSync(TARGET, { recursive: true });
  const files = [...CORE, ...[...needed].map((name) => lock.packages[name].file_name)];
  for (const file of files) copyFileSync(path.join(source, file), path.join(TARGET, file));
  copyFileSync(path.join(source, "pyodide-lock.json"), path.join(TARGET, ".completo"));
  console.log(
    `Pyodide ${VERSION} con ${[...needed].sort().join(", ")} en ${path.relative(ROOT, TARGET)}`,
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
