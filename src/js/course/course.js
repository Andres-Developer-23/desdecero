/*
 * Modelo del curso. El build genera los datos desde content/ y los
 * incrusta en la página como JSON; aquí se añaden la numeración y los
 * enlaces entre lecciones.
 */

import { pad2 } from "../lib/dates.js";

/** Lee el JSON que el build incrusta en <script type="application/json">. */
export function readCourseData(element) {
  return JSON.parse(element.textContent);
}

/**
 * @param {{modules: Array<{id: string, title: string, description: string, lessons: object[]}>}} data
 */
export function createCourse(data) {
  const lessons = [];

  const modules = data.modules.map((moduleData, index) => {
    const module = { ...moduleData, index, lessons: [] };
    module.lessons = moduleData.lessons.map((lessonData) => {
      const lesson = { ...lessonData, module, number: lessons.length + 1 };
      lessons.push(lesson);
      return lesson;
    });
    return module;
  });

  const byId = new Map(lessons.map((lesson) => [lesson.id, lesson]));

  return {
    modules,
    lessons,
    total: lessons.length,
    get: (id) => byId.get(id) ?? null,
    previous: (lesson) => lessons[lesson.number - 2] ?? null,
    next: (lesson) => lessons[lesson.number] ?? null,
    /** Primera lección que todavía no está completada, o null si no queda ninguna. */
    firstPending: (isDone) => lessons.find((lesson) => !isDone(lesson.id)) ?? null,
    totalMinutes: (filter = () => true) =>
      lessons.filter(filter).reduce((sum, lesson) => sum + lesson.minutes, 0),
  };
}

/** Ruta "de archivo" que se muestra en las migas de pan: 01-variables/textos.py */
export const lessonPath = (lesson) =>
  `${pad2(lesson.module.index)}-${lesson.module.id}/${lesson.id}.py`;
