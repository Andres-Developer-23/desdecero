/*
 * Cada ejercicio del curso tiene que poder resolverse:
 * la solución supera la comprobación y el código de partida no.
 * Además, los ejemplos de Flet de la teoría tienen que arrancar sin errores.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCourse } from "../../scripts/lib/load-course.js";
import { expect, openApp, servePage, test } from "./fixtures.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const course = loadCourse(path.join(ROOT, "content"));
const lessons = course.routes.flatMap((route) => route.modules.flatMap((module) => module.lessons));

/** Bloques ```py de la teoría que crean una app de Flet. */
const fletExamples = lessons.flatMap((lesson) =>
  [...lesson.theory.matchAll(/```py\n([\s\S]*?)```/g)]
    .map((match) => match[1])
    .filter((code) => /^\s*import flet\b/m.test(code))
    .map((code, index) => ({ name: `${lesson.id} · ejemplo ${index + 1}`, code })),
);

/** Comprobación mínima de un ejemplo: se ejecuta sin errores y llega a ft.run(main). */
const EXAMPLE_CHECK = { checks: {}, test: "from fletsim import *\npage()" };

/** Ejecuta el comprobador dentro de la página con el código indicado. */
async function check(page, lessonId, field) {
  return page.evaluate(
    async ({ id, field }) => {
      const { course, checkExercise, createTerminal } = window.__desdecero;
      const lesson = course.getLesson(id);
      const output = document.createElement("pre");
      const result = await checkExercise(lesson, lesson[field], createTerminal(output));
      return { ...result, log: output.textContent };
    },
    { id: lessonId, field },
  );
}

/** Ejecuta un ejemplo de Flet con el simulador y devuelve el resultado. */
async function runExample(page, code) {
  return page.evaluate(
    async ({ code, lesson }) => {
      const { checkExercise, createTerminal } = window.__desdecero;
      const output = document.createElement("pre");
      const result = await checkExercise(lesson, code, createTerminal(output));
      return { ...result, log: output.textContent };
    },
    { code, lesson: EXAMPLE_CHECK },
  );
}

test.describe("ejercicios", () => {
  // Una sola página para todas las lecciones: el motor de Python se carga una vez.
  test.describe.configure({ mode: "serial" });

  let page;
  test.beforeAll(async ({ browser }, testInfo) => {
    const { baseURL } = testInfo.project.use;
    page = await browser.newPage({ baseURL });
    await servePage(page, baseURL);
    await openApp(page);
  });
  test.afterAll(() => page.close());

  for (const lesson of lessons) {
    test(`${lesson.id}: la solución pasa y el código de partida no`, async () => {
      const solution = await check(page, lesson.id, "solution");
      expect(solution.passed, `la solución no pasa:\n${solution.log}`).toBe(true);

      const starter = await check(page, lesson.id, "starter");
      expect(starter.passed, "el código de partida ya supera el ejercicio").toBe(false);
    });
  }

  for (const example of fletExamples) {
    test(`${example.name} arranca en el simulador`, async () => {
      const result = await runExample(page, example.code);
      expect(result.passed, `el ejemplo falla:\n${result.log}`).toBe(true);
    });
  }
});
