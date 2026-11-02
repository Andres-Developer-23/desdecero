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

/**
 * Crea un curso de prueba con una ruta, un módulo y las lecciones indicadas.
 * web: archivos de la web de prácticas, por ruta dentro de web/.
 */
function makeCourse(name, lessons, routeJson = ROUTE_JSON, web = {}) {
  const dir = path.join(temp, name);
  const routeDir = path.join(dir, "01-ruta");
  const moduleDir = path.join(routeDir, "00-basico");
  mkdirSync(moduleDir, { recursive: true });
  writeFileSync(path.join(routeDir, "route.json"), routeJson);
  for (const [file, content] of Object.entries(web)) {
    const target = path.join(dir, "web", file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
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

const VALID_PROJECT = {
  "proyecto.md": [
    "---",
    "title: Gestor de tareas",
    "level: principiante",
    "tags: [CLI, Archivos]",
    "minutes: 60",
    "runtime: python",
    "requires: ruta",
    "file: tareas.py",
    "cli: true",
    "summary: Apunta tus tareas",
    "---",
    "",
    "Detalle del proyecto.",
    "",
    "### Requisitos",
    "",
    "- Agregar tareas.",
    "",
    "## Objetivo",
    "",
    "Escribe tareas.py.",
    "",
    "## Pista",
    "",
    "Usa sys.argv.",
    "",
    "## Solución",
    "",
    "Una función por orden.",
    "",
  ].join("\n"),
  "starter.py": "import sys\n",
  "solution.py": "import sys\nprint(sys.argv[1:])\n",
  "checks.json": JSON.stringify({
    persist: true,
    runs: [{ args: ["agregar", "Pan"], before: "x = 1", output: "['agregar', 'Pan']" }],
  }),
  "test.py": "assert True\n",
};

/** Añade proyectos (carpeta → archivos) a un curso de prueba. */
function addProjects(dir, projects) {
  for (const [folder, files] of Object.entries(projects)) {
    const projectDir = path.join(dir, "proyectos", folder);
    mkdirSync(projectDir, { recursive: true });
    for (const [file, content] of Object.entries(files)) {
      if (content !== undefined) writeFileSync(path.join(projectDir, file), content);
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
    assert.ok(course.projects.length >= 6);
    assert.equal(course.projects[0].id, "gestor-de-tareas");
    assert.ok(course.projects.every((project) => project.solution && project.exercise));
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
        web: null,
        db: null,
      },
    );
    assert.deepEqual(course.web, {});
    assert.deepEqual(course.apis, {});
    assert.deepEqual(course.databases, {});
    assert.deepEqual(course.data, {});
  });

  test("lee la web de prácticas: cada archivo en su URL", () => {
    const lesson = {
      ...VALID_LESSON,
      "lesson.md": VALID_LESSON["lesson.md"].replace(
        "summary:",
        "web: https://tienda.example/productos/\nsummary:",
      ),
    };
    const course = loadCourse(
      makeCourse("web", { "01-hola": lesson }, ROUTE_JSON, {
        "tienda.example/index.html": "<h1>Tienda</h1>",
        "tienda.example/productos/index.html": "<h1>Productos</h1>",
        "tienda.example/robots.txt": "User-agent: *\nDisallow: /admin/\n",
      }),
    );
    assert.deepEqual(Object.keys(course.web).sort(), [
      "https://tienda.example/index.html",
      "https://tienda.example/productos/index.html",
      "https://tienda.example/robots.txt",
    ]);
    assert.deepEqual(course.web["https://tienda.example/productos/index.html"], {
      type: "text/html; charset=utf-8",
      body: "<h1>Productos</h1>",
    });
    assert.equal(course.web["https://tienda.example/robots.txt"].type, "text/plain; charset=utf-8");
    assert.equal(course.routes[0].modules[0].lessons[0].web, "https://tienda.example/productos/");
  });

  test("valida la web de prácticas: dominios .example, tipos conocidos y páginas que existan", () => {
    const lesson = {
      ...VALID_LESSON,
      "lesson.md": VALID_LESSON["lesson.md"].replace(
        "summary:",
        "web: https://tienda.example/no-existe.html\nsummary:",
      ),
    };
    const dir = makeCourse("web-rota", { "01-hola": lesson }, ROUTE_JSON, {
      "tienda.example/index.html": "<h1>Tienda</h1>",
      "tienda.example/logo.png": "png",
      "google.com/index.html": "<h1>No</h1>",
    });
    assert.throws(
      () => loadCourse(dir),
      (error) => {
        const text = error.problems.join("\n");
        assert.match(text, /web\/google\.com: cada sitio es una carpeta con un dominio \.example/);
        assert.match(text, /logo\.png: tipo de archivo no admitido/);
        assert.match(
          text,
          /"web" apunta a una página que no existe: https:\/\/tienda\.example\/no-existe\.html/,
        );
        return true;
      },
    );
  });

  test("lee los datos de las APIs de práctica y admite lecciones que empiezan en una API", () => {
    const lesson = {
      ...VALID_LESSON,
      "lesson.md": VALID_LESSON["lesson.md"].replace(
        "summary:",
        "web: https://api.tienda.example/v1/productos?pagina=2\nsummary:",
      ),
    };
    const dir = makeCourse("apis", { "01-hola": lesson });
    mkdirSync(path.join(dir, "api"));
    writeFileSync(path.join(dir, "api", "api.tienda.example.json"), '{ "productos": [] }');
    const course = loadCourse(dir);
    assert.deepEqual(course.apis, { "api.tienda.example": { productos: [] } });
  });

  test("admite lecciones que empiezan en el servidor de Flask del alumno", () => {
    const lesson = (url) => ({
      ...VALID_LESSON,
      "lesson.md": VALID_LESSON["lesson.md"].replace("summary:", `web: ${url}\nsummary:`),
    });
    const course = loadCourse(
      makeCourse("flask", { "01-hola": lesson("http://127.0.0.1:5000/tareas") }),
    );
    assert.equal(course.routes[0].modules[0].lessons[0].web, "http://127.0.0.1:5000/tareas");
    assert.throws(
      () => loadCourse(makeCourse("flask-mal", { "01-hola": lesson("http://127.0.0.1:8000/") })),
      /"web" apunta a una página que no existe/,
    );
  });

  test("valida los archivos de las APIs: nombre api.<nombre>.example.json y JSON válido", () => {
    const dir = makeCourse("apis-rotas", { "01-hola": VALID_LESSON });
    mkdirSync(path.join(dir, "api"));
    writeFileSync(path.join(dir, "api", "tienda.json"), "{}");
    writeFileSync(path.join(dir, "api", "api.rota.example.json"), "{ no es json");
    assert.throws(
      () => loadCourse(dir),
      (error) => {
        const text = error.problems.join("\n");
        assert.match(
          text,
          /api\/tienda\.json: cada API es un archivo api\.<nombre>\.example\.json/,
        );
        assert.match(text, /api\.rota\.example\.json/);
        return true;
      },
    );
  });

  test("lee las bases de datos de práctica y las lecciones que empiezan con una", () => {
    const lesson = {
      ...VALID_LESSON,
      "lesson.md": VALID_LESSON["lesson.md"].replace("summary:", "db: tienda.db\nsummary:"),
    };
    const dir = makeCourse("db", { "01-hola": lesson });
    mkdirSync(path.join(dir, "db"));
    writeFileSync(path.join(dir, "db", "tienda.sql"), "CREATE TABLE t (x);\n");
    const course = loadCourse(dir);
    assert.deepEqual(course.databases, { "tienda.db": "CREATE TABLE t (x);\n" });
    assert.equal(course.routes[0].modules[0].lessons[0].db, "tienda.db");
  });

  test("valida las bases de práctica: archivos <nombre>.sql y lecciones que apunten a una que exista", () => {
    const lesson = {
      ...VALID_LESSON,
      "lesson.md": VALID_LESSON["lesson.md"].replace("summary:", "db: otra.db\nsummary:"),
    };
    const dir = makeCourse("db-rota", { "01-hola": lesson });
    mkdirSync(path.join(dir, "db"));
    writeFileSync(path.join(dir, "db", "Tienda.db"), "");
    assert.throws(
      () => loadCourse(dir),
      (error) => {
        const text = error.problems.join("\n");
        assert.match(text, /db\/Tienda\.db: cada base de práctica es un archivo <nombre>\.sql/);
        assert.match(text, /"db" apunta a una base de práctica que no existe: otra\.db/);
        return true;
      },
    );
  });

  test("lee los datos de práctica de pandas y valida sus nombres", () => {
    const dir = makeCourse("datos", { "01-hola": VALID_LESSON });
    mkdirSync(path.join(dir, "data"));
    writeFileSync(path.join(dir, "data", "ventas.csv"), "fecha,unidades\n2026-01-01,3\n");
    assert.deepEqual(loadCourse(dir).data, { "ventas.csv": "fecha,unidades\n2026-01-01,3\n" });

    writeFileSync(path.join(dir, "data", "Ventas Viejas.xlsx"), "");
    assert.throws(
      () => loadCourse(dir),
      /data\/Ventas Viejas\.xlsx: cada archivo de datos es un \.csv, \.txt o \.json/,
    );
  });

  test("lee los proyectos: nivel, etiquetas, programa, secciones y comprobaciones", () => {
    const dir = addProjects(makeCourse("proyectos", { "01-hola": VALID_LESSON }), {
      "01-gestor-de-tareas": VALID_PROJECT,
    });
    const [project] = loadCourse(dir).projects;
    assert.deepEqual(
      {
        id: project.id,
        level: project.level,
        tags: project.tags,
        runtime: project.runtime,
        requires: project.requires,
        file: project.file,
        cli: project.cli,
      },
      {
        id: "gestor-de-tareas",
        level: "principiante",
        tags: ["CLI", "Archivos"],
        runtime: "python",
        requires: "ruta",
        file: "tareas.py",
        cli: true,
      },
    );
    assert.equal(project.theory, "Detalle del proyecto.\n\n### Requisitos\n\n- Agregar tareas.");
    assert.equal(project.exercise, "Escribe tareas.py.");
    assert.equal(project.hint, "Usa sys.argv.");
    assert.equal(project.explanation, "Una función por orden.");
    assert.equal(project.test, "assert True");
    assert.equal(project.checks.persist, true);
    assert.deepEqual(project.checks.runs[0].args, ["agregar", "Pan"]);
    assert.equal(project.dir, undefined);
  });

  test("valida los proyectos: metadatos, secciones, ids y comprobaciones", () => {
    const meta = VALID_PROJECT["proyecto.md"];
    const dir = addProjects(makeCourse("proyectos-rotos", { "01-hola": VALID_LESSON }), {
      "01-roto": {
        ...VALID_PROJECT,
        "proyecto.md": meta
          .replace("level: principiante", "level: experto")
          .replace("tags: [CLI, Archivos]", "tags: CLI")
          .replace("requires: ruta", "requires: nada")
          .replace("file: tareas.py", "file: Tareas.txt")
          .replace("cli: true", "cli: sí")
          .replace("## Solución\n\nUna función por orden.\n", ""),
        "checks.json": JSON.stringify({
          persist: "sí",
          runs: [{ args: "agregar", before: 3, output: 1, contains: "Pan" }],
        }),
      },
      "02-hola": VALID_PROJECT,
    });
    assert.throws(
      () => loadCourse(dir),
      (error) => {
        const text = error.problems.join("\n");
        assert.match(
          text,
          /01-roto\/proyecto\.md: "level" debe ser uno de: principiante, intermedio, avanzado/,
        );
        assert.match(text, /01-roto\/proyecto\.md: "tags" debe ser una lista de etiquetas/);
        assert.match(text, /01-roto\/proyecto\.md: "file" debe ser el nombre del programa/);
        assert.match(text, /01-roto\/proyecto\.md: "cli" debe ser true o false/);
        assert.match(text, /01-roto\/proyecto\.md: falta contenido en la sección "## Solución"/);
        assert.match(text, /01-roto\/proyecto\.md: "requires" apunta a una ruta que no existe/);
        assert.match(text, /01-roto\/checks\.json: "persist" debe ser true o false/);
        assert.match(text, /runs\[0\]\.args debe ser una lista de textos/);
        assert.match(text, /runs\[0\]\.contains debe ser una lista de textos/);
        assert.match(text, /runs\[0\]\.output debe ser un texto/);
        assert.match(text, /runs\[0\]\.before debe ser código de Python/);
        // Las lecciones y los proyectos comparten los ids: los dos se guardan en el progreso.
        assert.match(text, /02-hola: el id "hola" ya se usa/);
        return true;
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
        assert.match(
          text,
          /route\.json: "runtime" debe ser uno de: python, flet, web, sqlite, pandas/,
        );
        assert.match(text, /route\.json: "requires" apunta a una ruta que no existe/);
        return true;
      },
    );
  });
});
