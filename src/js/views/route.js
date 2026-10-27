/* Vista de una ruta: sus módulos y lecciones, con el progreso de cada uno. */

import { $, escapeHtml } from "../lib/dom.js";
import { pad2 } from "../lib/dates.js";
import { asciiBar, formatDuration } from "../ui/format.js";

/**
 * @param {object} deps
 * @param {ReturnType<import("../course/course.js").createCourse>} deps.course
 * @param {ReturnType<import("../progress/progress.js").createProgress>} deps.progress
 */
export function createRouteView({ course, progress }) {
  const root = $("#view-route");
  const elements = {
    command: $("#route-command"),
    title: $("#route-title"),
    description: $("#route-description"),
    meta: $("#route-meta"),
    progress: $("#route-progress"),
    actions: $("#route-actions"),
    modules: $("#route-modules"),
  };
  let route = null;

  function render() {
    if (!route) return;
    const { isDone } = progress;
    const done = course.doneIn(route, isDone);
    const next = course.firstPending(route, isDone);
    const required = route.requires ? course.getRoute(route.requires) : null;

    elements.command.textContent = `ls ./rutas/${route.id}`;
    elements.title.textContent = route.title;
    elements.description.textContent = route.description;
    elements.meta.innerHTML = [
      `<span>${escapeHtml(route.level)}</span>`,
      `<span>${route.modules.length} módulos</span>`,
      `<span>${route.total} lecciones</span>`,
      `<span>~${formatDuration(route.minutes)}</span>`,
      required
        ? `<span>requisito: <a href="#ruta-${required.id}">${escapeHtml(required.title)}</a></span>`
        : "",
    ].join("");
    elements.progress.innerHTML = `${asciiBar(done / route.total, 24)} ${done}/${route.total} lecciones`;
    elements.actions.innerHTML = next
      ? `<a class="cta cta--primary" href="#l-${next.id}"><span class="cta__label">[${done ? "continuar" : "empezar"}: ${escapeHtml(next.title)}]</span></a>`
      : "";
    elements.modules.innerHTML = route.modules
      .map((module) => moduleHtml(module, { isDone, nextId: next?.id }))
      .join("");
  }

  return {
    root,
    get title() {
      return route ? `${route.title} · Python desde Cero` : "Python desde Cero";
    },

    /** @param {{route: object}} params */
    show(params) {
      route = params.route;
      render();
      window.scrollTo(0, 0);
    },

    refresh: render,
  };
}

/* ---- Plantillas ---- */

function moduleHtml(module, { isDone, nextId }) {
  const total = module.lessons.length;
  const done = module.lessons.filter((lesson) => isDone(lesson.id)).length;
  const headingId = `module-${module.route.id}-${module.id}`;

  return `<section class="module${done === total ? " module--done" : ""}" aria-labelledby="${headingId}">
  <div class="module__head">
    <span class="module__number">${pad2(module.index)}</span>
    <h2 class="module__title" id="${headingId}">${escapeHtml(module.title)}</h2>
    <span class="module__progress" aria-label="${done} de ${total} lecciones">${asciiBar(done / total, 8)}<span class="module__count">${done}/${total}</span></span>
    <p class="module__description">${escapeHtml(module.description)}</p>
  </div>
  <ol class="module__lessons">${module.lessons
    .map((lesson) =>
      lessonLinkHtml(lesson, { done: isDone(lesson.id), next: lesson.id === nextId }),
    )
    .join("")}</ol>
</section>`;
}

function lessonLinkHtml(lesson, { done, next }) {
  const modifier = done ? " lesson-link--done" : next ? " lesson-link--next" : "";
  const mark = done ? "[x]" : next ? "[>]" : "[ ]";
  return `<li><a class="lesson-link${modifier}" href="#l-${lesson.id}">
  <span class="lesson-link__mark" aria-hidden="true">${mark}</span>
  <span class="lesson-link__number">${pad2(lesson.number)}</span>
  <span class="lesson-link__title">${escapeHtml(lesson.title)}${done ? '<span class="sr-only"> (completada)</span>' : ""}</span>
  <span class="lesson-link__minutes">${lesson.minutes} min</span>
  <span class="lesson-link__summary">${escapeHtml(lesson.summary)}</span>
</a></li>`;
}
