/* Vista del panel: resumen del progreso, ruta completa y actividad reciente. */

import { $, escapeHtml } from "../lib/dom.js";
import { addDays, pad2, splitMinutes, todayKey } from "../lib/dates.js";
import { syncStatusText } from "../ui/header.js";

const HEATMAP_DAYS = 28;

/**
 * @param {object} deps
 * @param {ReturnType<import("../course/course.js").createCourse>} deps.course
 * @param {ReturnType<import("../progress/progress.js").createProgress>} deps.progress
 * @param {() => "account" | "local"} deps.getSyncStatus
 */
export function createPanelView({ course, progress, getSyncStatus }) {
  const root = $("#view-panel");
  const elements = {
    terminal: $("#panel-terminal"),
    actions: $("#panel-actions"),
    stats: $("#panel-stats"),
    modules: $("#panel-modules"),
    heatmap: $("#panel-heatmap"),
    activity: $("#panel-activity"),
    finished: $("#panel-finished"),
    route: $("#ruta"),
  };

  function render() {
    const next = course.firstPending(progress.isDone);
    const done = progress.completedCount();

    elements.terminal.innerHTML = terminalHtml({
      done,
      total: course.total,
      next,
      streak: progress.streak(),
    });
    elements.actions.innerHTML = actionsHtml({ next, done, last: course.lessons.at(-1) });
    elements.stats.innerHTML = statsHtml({
      done,
      total: course.total,
      streak: progress.streak(),
      minutesLeft: course.totalMinutes((lesson) => !progress.isDone(lesson.id)),
      syncStatus: getSyncStatus(),
    });
    elements.modules.innerHTML = course.modules
      .map((module) => moduleHtml(module, { isDone: progress.isDone, nextId: next?.id }))
      .join("");
    renderActivity(progress.activeDays());
    elements.finished.hidden = Boolean(next);
  }

  function renderActivity(activeDays) {
    const active = new Set(activeDays);
    const today = todayKey();
    let count = 0;
    const cells = [];
    for (let offset = HEATMAP_DAYS - 1; offset >= 0; offset--) {
      const day = addDays(today, -offset);
      const isActive = active.has(day);
      if (isActive) count++;
      const classes = ["heatmap__day"];
      if (isActive) classes.push("heatmap__day--active");
      if (offset === 0) classes.push("heatmap__day--today");
      cells.push(
        `<span class="${classes.join(" ")}" title="${day}${isActive ? " · practicaste" : ""}"></span>`,
      );
    }
    elements.heatmap.innerHTML = cells.join("");
    elements.activity.textContent = count
      ? `Practicaste ${count} ${count === 1 ? "día" : "días"} de los últimos ${HEATMAP_DAYS}. Un rato cada día rinde más que una tarde entera a la semana.`
      : "Todavía no hay actividad. Ejecuta tu primer ejemplo y el día de hoy se encenderá aquí.";
  }

  return {
    root,
    title: "Python desde Cero",
    nav: "panel",

    /** @param {{section?: "route"}} [params] */
    show(params = {}) {
      render();
      if (params.section === "route") {
        requestAnimationFrame(() => {
          const top = elements.route.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top });
        });
      } else {
        window.scrollTo(0, 0);
      }
    },

    refresh: render,
  };
}

/* ---- Plantillas ---- */

/** Barra de progreso con caracteres: ████░░░░ */
export function asciiBar(fraction, width) {
  const filled = Math.round(fraction * width);
  return `<span class="ascii-bar">${"█".repeat(filled)}<span class="ascii-bar__empty">${"░".repeat(width - filled)}</span></span>`;
}

function terminalHtml({ done, total, next, streak }) {
  const ok = '<span class="terminal__ok">[ok]</span>  ';
  const pending = '<span class="terminal__muted">[..]</span>  ';
  const lines = ['<span class="terminal__prompt">$</span> python3 progreso.py'];

  if (done === 0) {
    lines.push(`${ok} entorno listo: python corre en tu navegador`);
    lines.push(`${pending} 0/${total} lecciones completadas`);
  } else {
    lines.push(`${ok} ${done}/${total} lecciones completadas`);
    lines.push(`${streak ? ok : pending} racha actual: ${streak} ${streak === 1 ? "día" : "días"}`);
  }
  lines.push(
    next
      ? `<span class="terminal__next">[&gt;&gt;]</span>   siguiente: ${pad2(next.number)} · ${escapeHtml(next.title)}`
      : `${ok} ruta completada. buen trabajo.`,
  );
  lines.push('<span class="terminal__muted">[skip]</span> memorizar sintaxis sin escribir código');
  lines.push("");
  lines.push(
    `<span class="terminal__muted">progreso</span> ${asciiBar(done / total, 20)} ${Math.round((done / total) * 100)}%`,
  );
  lines.push(
    '<span class="terminal__prompt">$</span> <span class="caret" aria-hidden="true"></span>',
  );
  return lines.join("\n");
}

function actionsHtml({ next, done, last }) {
  const cta = (href, label, primary) =>
    `<a class="cta${primary ? " cta--primary" : ""}" href="${href}"><span class="cta__label">[${escapeHtml(label)}]</span></a>`;

  if (next) {
    return (
      cta(`#l-${next.id}`, `${done ? "continuar" : "empezar"}: ${next.title}`, true) +
      cta("#playground", "abrir playground", false)
    );
  }
  return (
    cta("#playground", "abrir playground", true) +
    cta(`#l-${last.id}`, "repasar el proyecto", false)
  );
}

function statsHtml({ done, total, streak, minutesLeft, syncStatus }) {
  const unit = (text) => `<span class="stat__unit"> ${text}</span>`;
  const { hours, minutes } = splitMinutes(minutesLeft);
  const timeLeft = minutesLeft
    ? `~${hours ? `${hours}${unit("h")} ${pad2(minutes)}` : minutes}${unit("min")}`
    : `0${unit("min")}`;

  const stat = (label, value, modifier = "") =>
    `<div class="stat"><div class="stat__label">${label}</div><div class="stat__value${modifier}">${value}</div></div>`;

  return [
    stat("lecciones", `${done}${unit(`/ ${total}`)}`),
    stat("racha", `${streak}${unit(streak === 1 ? "día" : "días")}`),
    stat("tiempo restante", timeLeft),
    stat("progreso guardado", syncStatusText(syncStatus), " stat__value--text"),
  ].join("");
}

function moduleHtml(module, { isDone, nextId }) {
  const total = module.lessons.length;
  const done = module.lessons.filter((lesson) => isDone(lesson.id)).length;
  const headingId = `module-${module.id}`;

  return `<section class="module${done === total ? " module--done" : ""}" aria-labelledby="${headingId}">
  <div class="module__head">
    <span class="module__number">${pad2(module.index)}</span>
    <h3 class="module__title" id="${headingId}">${escapeHtml(module.title)}</h3>
    <span class="module__progress" aria-label="${done} de ${total} lecciones">${asciiBar(done / total, 8)}<span class="module__count">${done}/${total}</span></span>
    <p class="module__description">${escapeHtml(module.description)}</p>
  </div>
  <ol class="module__lessons">${module.lessons.map((lesson) => lessonLinkHtml(lesson, { done: isDone(lesson.id), next: lesson.id === nextId })).join("")}</ol>
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
