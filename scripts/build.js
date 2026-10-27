#!/usr/bin/env node
/*
 * Genera dist/index.html: una sola página con los estilos, el script y el
 * curso incrustados, que funciona abriéndola directamente o publicada en
 * cualquier hosting estático.
 *
 *   npm run build
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";
import { CourseError, loadCourse } from "./lib/load-course.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const OUT_DIR = path.join(ROOT, "dist");

const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));

async function build() {
  const course = loadCourse(path.join(ROOT, "content"));

  const [script, styles] = await Promise.all([
    bundle(path.join(SRC, "js/main.js"), {
      format: "iife",
      define: {
        __SKULPT_VERSION__: JSON.stringify(pkg.devDependencies.skulpt),
        __CODEMIRROR_VERSION__: JSON.stringify(pkg.devDependencies.codemirror),
      },
    }),
    bundle(path.join(SRC, "styles/main.css")),
  ]);

  const html = readFileSync(path.join(SRC, "index.html"), "utf8")
    .replace("<!-- build:styles -->", () => `<style>${styles}</style>`)
    .replace(
      "<!-- build:course -->",
      () => `<script type="application/json" id="course-data">${safeJson(course)}</script>`,
    )
    .replace("<!-- build:script -->", () => `<script>${script}</script>`);

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(path.join(OUT_DIR, "index.html"), html);

  const size = (Buffer.byteLength(html) / 1024).toFixed(0);
  console.log(`dist/index.html · ${size} KB`);
  for (const route of course.routes) {
    const lessons = route.modules.reduce((sum, module) => sum + module.lessons.length, 0);
    console.log(`  ${route.id}: ${route.modules.length} módulos · ${lessons} lecciones`);
  }
}

/** Empaqueta un punto de entrada con esbuild y devuelve el código resultante. */
async function bundle(entryPoint, options = {}) {
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    write: false,
    target: ["es2022", "chrome100", "firefox100", "safari15.4"],
    logLevel: "warning",
    ...options,
  });
  return result.outputFiles[0].text.trim();
}

/** JSON que se puede meter dentro de <script> sin cerrarlo por accidente. */
function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

build().catch((error) => {
  console.error(error instanceof CourseError ? error.message : error);
  process.exit(1);
});
