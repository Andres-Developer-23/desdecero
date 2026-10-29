/*
 * Cada ejercicio del curso tiene que poder resolverse:
 * la solución supera la comprobación y el código de partida no.
 * Además, los ejemplos de la teoría de las rutas con simulador (Flet y
 * scraping) tienen que ejecutarse sin errores.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCourse } from "../../scripts/lib/load-course.js";
import { expect, openApp, servePage, test } from "./fixtures.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const course = loadCourse(path.join(ROOT, "content"));
const lessons = course.routes.flatMap((route) => route.modules.flatMap((module) => module.lessons));

/**
 * Bloques ```py de la teoría de las rutas con simulador. Los de Flet,
 * además de ejecutarse sin errores, tienen que llegar a ft.run(main).
 */
const simulatorExamples = course.routes
  .filter((route) => route.runtime !== "python")
  .flatMap((route) => route.modules.flatMap((module) => module.lessons))
  .flatMap((lesson) =>
    [...lesson.theory.matchAll(/```py\n([\s\S]*?)```/g)]
      .map((match) => match[1])
      .map((code, index) => ({
        name: `${lesson.id} · ejemplo ${index + 1}`,
        code,
        test: /^\s*import flet\b/m.test(code) ? "from fletsim import *\npage()" : "",
      })),
  );

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

/** Ejecuta un ejemplo con su comprobación mínima y devuelve el resultado. */
async function runExample(page, { code, test }) {
  return page.evaluate(
    async ({ code, test }) => {
      const { checkExercise, createTerminal } = window.__desdecero;
      const output = document.createElement("pre");
      const result = await checkExercise({ checks: {}, test }, code, createTerminal(output));
      return { ...result, log: output.textContent };
    },
    { code, test },
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

  for (const example of simulatorExamples) {
    test(`${example.name} se ejecuta en el simulador`, async () => {
      const result = await runExample(page, example);
      expect(result.passed, `el ejemplo falla:\n${result.log}`).toBe(true);
    });
  }
});
