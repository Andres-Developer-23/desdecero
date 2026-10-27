import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, describe, test } from "node:test";
import { CourseError, loadCourse } from "../../scripts/lib/load-course.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const temp = mkdtempSync(path.join(tmpdir(), "desdecero-"));
after(() => rmSync(temp, { recursive: true, force: true }));

const VALID_LESSON = {
  "lesson.md":
    "---\ntitle: Hola\nminutes: 10\nsummary: Primer programa\n---\n\nTeoría.\n\n## Ejercicio\n\nImprime hola.\n\n## Pista\n\nUsa print.\n",
  "starter.py": "\n",
  "solution.py": 'print("hola")\n',
  "checks.json": '{ "runs": [{ "output": "hola" }] }\n',
};

const ROUTE_JSON =
  '{ "title": "Ruta", "description": "De prueba", "level": "Inicial", "runtime": "python" }';

/** Crea un curso de prueba con una ruta, un módulo y las lecciones indicadas. */
function makeCourse(name, lessons, routeJson = ROUTE_JSON) {
  const dir = path.join(temp, name);
  const routeDir = path.join(dir, "01-ruta");
  const moduleDir = path.join(routeDir, "00-basico");
  mkdirSync(moduleDir, { recursive: true });
  writeFileSync(path.join(routeDir, "route.json"), routeJson);
  writeFileSync(
    path.join(moduleDir, "module.json"),
    '{ "title": "Básico", "description": "Lo primero" }',
  );
  for (const [folder, files] of Object.entries(lessons)) {
    mkdirSync(path.join(moduleDir, folder));
    for (const [file, content] of Object.entries(files)) {
      if (content !== undefined) writeFileSync(path.join(moduleDir, folder, file), content);
    }
  }
  return dir;
}

describe("carga del contenido", () => {
  test("el curso real se carga completo", () => {
    const course = loadCourse(path.join(ROOT, "content"));
    const python = course.routes.find((route) => route.id === "python");
    const lessons = python.modules.flatMap((module) => module.lessons);
    assert.equal(python.runtime, "python");
    assert.equal(python.modules.length, 7);
    assert.equal(lessons.length, 20);
    assert.equal(lessons[0].id, "hola-mundo");
    assert.equal(lessons.at(-1).id, "adivina");
  });

  test("lee metadatos, secciones, código y comprobaciones de una lección", () => {
    const course = loadCourse(makeCourse("valido", { "01-hola": VALID_LESSON }));
    const [route] = course.routes;
    assert.deepEqual(
      { id: route.id, level: route.level, runtime: route.runtime, requires: route.requires },
      { id: "ruta", level: "Inicial", runtime: "python", requires: null },
    );
    const [lesson] = route.modules[0].lessons;
    assert.deepEqual(
      { ...lesson },
      {
        id: "hola",
        title: "Hola",
        minutes: 10,
        summary: "Primer programa",
        theory: "Teoría.",
        exercise: "Imprime hola.",
        hint: "Usa print.",
        starter: "\n",
        solution: 'print("hola")\n',
        test: "",
        checks: { runs: [{ output: "hola" }] },
      },
    );
  });

  test("informa de todos los problemas a la vez, con la ruta del archivo", () => {
    const dir = makeCourse("roto", {
      "01-hola": { ...VALID_LESSON, "checks.json": '{ "runs": [{ "salida": "x" }] }' },
      "02-hola": { ...VALID_LESSON, "solution.py": undefined },
      "03-sin-pista": {
        ...VALID_LESSON,
        "lesson.md": VALID_LESSON["lesson.md"].replace("## Pista\n\nUsa print.\n", ""),
      },
    });

    assert.throws(
      () => loadCourse(dir),
      (error) => {
        assert.ok(error instanceof CourseError);
        const text = error.problems.join("\n");
        assert.match(text, /01-hola\/checks\.json: runs\[0\] tiene una clave desconocida "salida"/);
        assert.match(text, /02-hola: el id "hola" ya se usa/);
        assert.match(text, /02-hola\/solution\.py: falta el archivo/);
        assert.match(text, /03-sin-pista\/lesson\.md: falta contenido en la sección "## Pista"/);
        return true;
      },
    );
  });

  test("valida route.json: motor conocido y requisitos que existan", () => {
    const dir = makeCourse(
      "ruta-rota",
      { "01-hola": VALID_LESSON },
      '{ "title": "Ruta", "description": "x", "level": "x", "runtime": "java", "requires": "nada" }',
    );
    assert.throws(
      () => loadCourse(dir),
      (error) => {
        const text = error.problems.join("\n");
        assert.match(text, /route\.json: "runtime" debe ser uno de: python, flet/);
        assert.match(text, /route\.json: "requires" apunta a una ruta que no existe/);
        return true;
      },
    );
  });
});
