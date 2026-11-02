import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createCourse,
  filterProjects,
  lessonPath,
  projectPath,
} from "../../src/js/course/course.js";
import { parseHash } from "../../src/js/hash-routes.js";

const lesson = (id, minutes = 10) => ({ id, title: id, minutes });

const course = createCourse({
  routes: [
    {
      id: "python",
      title: "Python",
      modules: [
        { id: "intro", lessons: [lesson("a"), lesson("b")] },
        { id: "bucles", lessons: [lesson("c", 20)] },
      ],
    },
    {
      id: "flet",
      title: "Flet",
      requires: "python",
      modules: [{ id: "app", lessons: [lesson("d"), lesson("e")] }],
    },
  ],
});

const project = (id, level, tags) => ({
  id,
  title: id,
  minutes: 60,
  level,
  tags,
  file: `${id}.py`,
});

const withProjects = createCourse({
  routes: [{ id: "python", title: "Python", modules: [{ id: "intro", lessons: [lesson("a")] }] }],
  projects: [
    project("tareas", "principiante", ["CLI"]),
    project("gastos", "principiante", ["CLI", "CSV"]),
    project("api", "intermedio", ["Flask"]),
  ],
});

const doneSet = (...ids) => {
  const done = new Set(ids);
  return (id) => done.has(id);
};

describe("modelo del curso", () => {
  test("numera las lecciones dentro de cada ruta", () => {
    assert.deepEqual(
      course.lessons.map((l) => `${l.route.id}:${l.number}`),
      ["python:1", "python:2", "python:3", "flet:1", "flet:2"],
    );
    assert.equal(course.getRoute("python").total, 3);
    assert.equal(course.getRoute("python").minutes, 40);
  });

  test("anterior y siguiente no salen de la ruta", () => {
    assert.equal(course.next(course.getLesson("b")).id, "c");
    assert.equal(course.next(course.getLesson("c")), null);
    assert.equal(course.previous(course.getLesson("d")), null);
  });

  test("suggestNext sigue la ruta empezada antes que empezar otra", () => {
    assert.equal(course.suggestNext(doneSet()).id, "a");
    assert.equal(course.suggestNext(doneSet("d")).id, "e");
    assert.equal(course.suggestNext(doneSet("a", "b", "c")).id, "d");
    assert.equal(course.suggestNext(doneSet("a", "b", "c", "d", "e")), null);
  });

  test("minutos pendientes y lecciones hechas por ruta", () => {
    const isDone = doneSet("a", "d");
    assert.equal(course.minutesLeft(isDone), 40);
    assert.equal(course.minutesLeft(isDone, course.getRoute("flet")), 10);
    assert.equal(course.doneIn(course.getRoute("python"), isDone), 1);
  });

  test("lessonPath incluye la ruta y el módulo", () => {
    assert.equal(lessonPath(course.getLesson("c")), "python/01-bucles/c.py");
  });
});

describe("proyectos", () => {
  test("se numeran y se recorren con anterior y siguiente, sin mezclarse con las lecciones", () => {
    const [tareas, gastos, api] = withProjects.projects;
    assert.deepEqual(
      withProjects.projects.map((item) => [item.number, item.kind, item.route.id]),
      [
        [1, "project", "proyectos"],
        [2, "project", "proyectos"],
        [3, "project", "proyectos"],
      ],
    );
    assert.equal(withProjects.getProject("gastos"), gastos);
    assert.equal(withProjects.getProject("a"), null);
    assert.equal(withProjects.getLesson("tareas"), null);
    assert.equal(withProjects.previous(tareas), null);
    assert.equal(withProjects.next(tareas), gastos);
    assert.equal(withProjects.next(api), null);
    assert.equal(withProjects.next(withProjects.getLesson("a")), null);
  });

  test("las lecciones y los proyectos hechos se cuentan por separado", () => {
    const isDone = doneSet("a", "gastos", "api");
    assert.equal(withProjects.lessonsDone(isDone), 1);
    assert.equal(withProjects.projectsDone(isDone), 2);
    assert.equal(withProjects.total, 1);
  });

  test("projectPath incluye la carpeta del proyecto y su programa", () => {
    assert.equal(projectPath(withProjects.getProject("tareas")), "proyectos/tareas/tareas.py");
  });

  test("filterProjects filtra por nivel y por tema", () => {
    const ids = (filters) => filterProjects(withProjects.projects, filters).map((item) => item.id);
    assert.deepEqual(ids({}), ["tareas", "gastos", "api"]);
    assert.deepEqual(ids({ level: "principiante" }), ["tareas", "gastos"]);
    assert.deepEqual(ids({ tag: "CSV" }), ["gastos"]);
    assert.deepEqual(ids({ level: "intermedio", tag: "CLI" }), []);
  });
});

describe("hash de la URL", () => {
  test("lecciones, rutas y playground", () => {
    assert.equal(parseHash("#l-c", course).params.lesson.id, "c");
    assert.equal(parseHash("#ruta-flet", course).params.route.id, "flet");
    assert.deepEqual(parseHash("#playground", course).view, "playground");
  });

  test("el catálogo de proyectos y cada proyecto, que se abre en la vista de lección", () => {
    assert.deepEqual(parseHash("#proyectos", withProjects), {
      view: "projects",
      params: {},
      nav: "proyectos",
    });
    const opened = parseHash("#p-gastos", withProjects);
    assert.equal(opened.view, "lesson");
    assert.equal(opened.nav, "proyectos");
    assert.equal(opened.params.lesson.id, "gastos");
    assert.equal(parseHash("#p-no-existe", withProjects).view, "panel");
    assert.equal(parseHash("#l-tareas", withProjects).view, "panel");
  });

  test("#ruta de la versión 1.x lleva a la primera ruta", () => {
    const route = parseHash("#ruta", course);
    assert.equal(route.view, "route");
    assert.equal(route.params.route.id, "python");
  });

  test("lo desconocido vuelve al panel", () => {
    assert.deepEqual(parseHash("#l-no-existe", course), {
      view: "panel",
      params: {},
      nav: "panel",
    });
    assert.equal(parseHash("#rutas", course).params.section, "routes");
  });
});
