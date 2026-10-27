import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createCourse, lessonPath } from "../../src/js/course/course.js";
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

describe("hash de la URL", () => {
  test("lecciones, rutas y playground", () => {
    assert.equal(parseHash("#l-c", course).params.lesson.id, "c");
    assert.equal(parseHash("#ruta-flet", course).params.route.id, "flet");
    assert.deepEqual(parseHash("#playground", course).view, "playground");
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
