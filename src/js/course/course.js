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

/** Lo que tienen en común los proyectos para la vista de lección: su «ruta» es la sección. */
export const PROJECTS_SECTION = { id: "proyectos", title: "Proyectos" };

/** Los niveles de los proyectos, en orden. */
export const PROJECT_LEVELS = ["principiante", "intermedio", "avanzado"];

/**
 * @param {{routes: Array<{id: string, title: string, modules: Array<{lessons: object[]}>}>, projects?: object[]}} data
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

  // Los proyectos se abren en la misma vista que las lecciones (kind: "project").
  const projects = (data.projects ?? []).map((projectData, index) => ({
    ...projectData,
    kind: "project",
    number: index + 1,
    route: PROJECTS_SECTION,
  }));
  const projectsById = new Map(projects.map((project) => [project.id, project]));
  const siblings = (item) => (item.kind === "project" ? projects : item.route.lessons);

  return {
    routes,
    lessons,
    projects,
    total: lessons.length,

    getLesson: (id) => lessonsById.get(id) ?? null,
    getProject: (id) => projectsById.get(id) ?? null,
    getRoute: (id) => routesById.get(id) ?? null,

    /** Lección anterior dentro de la misma ruta (o el proyecto anterior). */
    previous: (item) => siblings(item)[item.number - 2] ?? null,
    /** Lección siguiente dentro de la misma ruta (o el proyecto siguiente). */
    next: (item) => siblings(item)[item.number] ?? null,

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

    /** Lecciones completadas de todo el curso (sin contar los proyectos). */
    lessonsDone: (isDone) => lessons.filter((lesson) => isDone(lesson.id)).length,

    /** Proyectos completados. */
    projectsDone: (isDone) => projects.filter((project) => isDone(project.id)).length,
  };
}

/** Los proyectos que pasan los filtros: un nivel (o todos) y un tema (o todos). */
export function filterProjects(projects, { level = null, tag = null } = {}) {
  return projects.filter(
    (project) => (!level || project.level === level) && (!tag || project.tags.includes(tag)),
  );
}

/** Ruta "de archivo" de un proyecto, para las migas de pan: proyectos/gestor-de-tareas/tareas.py */
export const projectPath = (project) => `proyectos/${project.id}/${project.file}`;

/** Ruta "de archivo" que se muestra en las migas de pan: python/01-variables/textos.py */
export const lessonPath = (lesson) =>
  `${lesson.route.id}/${pad2(lesson.module.index)}-${lesson.module.id}/${lesson.id}.py`;

function sumMinutes(lessons) {
  return lessons.reduce((sum, lesson) => sum + lesson.minutes, 0);
}
