/*
 * Modelo del curso. El build genera los datos desde content/ y los
 * incrusta en la página como JSON; aquí se añaden la numeración y los
 * enlaces entre rutas, módulos y lecciones.
 *
 * No depende del navegador: se prueba en tests/unit.
 */

import { pad2 } from "../lib/dates.js";

/** Lee el JSON que el build incrusta en <script type="application/json">. */
export function readCourseData(element) {
  return JSON.parse(element.textContent);
}

/**
 * @param {{routes: Array<{id: string, title: string, modules: Array<{lessons: object[]}>}>}} data
 */
export function createCourse(data) {
  const lessons = [];

  const routes = data.routes.map((routeData, routeIndex) => {
    const route = { ...routeData, index: routeIndex, modules: [], lessons: [] };
    route.modules = routeData.modules.map((moduleData, moduleIndex) => {
      const module = { ...moduleData, index: moduleIndex, route, lessons: [] };
      module.lessons = moduleData.lessons.map((lessonData) => {
        // Las lecciones se numeran dentro de su ruta: "lección 3 de 12".
        const lesson = { ...lessonData, module, route, number: route.lessons.length + 1 };
        route.lessons.push(lesson);
        lessons.push(lesson);
        return lesson;
      });
      return module;
    });
    route.total = route.lessons.length;
    route.minutes = sumMinutes(route.lessons);
    return route;
  });

  const lessonsById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
  const routesById = new Map(routes.map((route) => [route.id, route]));

  return {
    routes,
    lessons,
    total: lessons.length,

    getLesson: (id) => lessonsById.get(id) ?? null,
    getRoute: (id) => routesById.get(id) ?? null,

    /** Lección anterior dentro de la misma ruta. */
    previous: (lesson) => lesson.route.lessons[lesson.number - 2] ?? null,
    /** Lección siguiente dentro de la misma ruta. */
    next: (lesson) => lesson.route.lessons[lesson.number] ?? null,

    /** Primera lección pendiente de una ruta, o null si está terminada. */
    firstPending: (route, isDone) => route.lessons.find((lesson) => !isDone(lesson.id)) ?? null,

    /**
     * La lección con la que seguir: la siguiente de la primera ruta empezada
     * y sin terminar; si no hay ninguna empezada, la primera pendiente.
     */
    suggestNext(isDone) {
      const started = routes.find(
        (route) =>
          route.lessons.some((l) => isDone(l.id)) && route.lessons.some((l) => !isDone(l.id)),
      );
      const route = started ?? routes.find((r) => r.lessons.some((l) => !isDone(l.id)));
      return route ? route.lessons.find((lesson) => !isDone(lesson.id)) : null;
    },

    /** Minutos de las lecciones pendientes, de todo el curso o de una ruta. */
    minutesLeft: (isDone, route = null) =>
      sumMinutes((route ? route.lessons : lessons).filter((lesson) => !isDone(lesson.id))),

    /** Lecciones completadas de una ruta. */
    doneIn: (route, isDone) => route.lessons.filter((lesson) => isDone(lesson.id)).length,
  };
}

/** Ruta "de archivo" que se muestra en las migas de pan: python/01-variables/textos.py */
export const lessonPath = (lesson) =>
  `${lesson.route.id}/${pad2(lesson.module.index)}-${lesson.module.id}/${lesson.id}.py`;

function sumMinutes(lessons) {
  return lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
}
