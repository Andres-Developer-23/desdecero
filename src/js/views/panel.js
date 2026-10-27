/* Vista del panel: resumen del progreso, rutas disponibles y actividad reciente. */

import { $, escapeHtml } from "../lib/dom.js";
import { addDays, pad2, splitMinutes, todayKey } from "../lib/dates.js";
import { asciiBar, formatDuration, plural } from "../ui/format.js";
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
    routes: $("#panel-routes"),
    routesSection: $("#rutas"),
    heatmap: $("#panel-heatmap"),
    activity: $("#panel-activity"),
    finished: $("#panel-finished"),
  };

  function render() {
    const { isDone } = progress;
    const next = course.suggestNext(isDone);
    const done = progress.completedCount();
    const streak = progress.streak();

    elements.terminal.innerHTML = terminalHtml({ course, isDone, done, next, streak });
    elements.actions.innerHTML = actionsHtml({ next, done });
    elements.stats.innerHTML = statsHtml({
      done,
      total: course.total,
      streak,
      minutesLeft: course.minutesLeft(isDone),
      syncStatus: getSyncStatus(),
    });
    elements.routes.innerHTML = course.routes
      .map((route) => routeCardHtml(route, { course, isDone }))
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
      ? `Practicaste ${plural(count, "día")} de los últimos ${HEATMAP_DAYS}. Un rato cada día rinde más que una tarde entera a la semana.`
      : "Todavía no hay actividad. Ejecuta tu primer ejemplo y el día de hoy se encenderá aquí.";
  }

  return {
    root,
    title: "Python desde Cero",

    /** @param {{section?: "routes"}} [params] */
    show(params = {}) {
      render();
      if (params.section === "routes") {
        requestAnimationFrame(() => {
          const top = elements.routesSection.getBoundingClientRect().top + window.scrollY - 80;
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

function terminalHtml({ course, isDone, done, next, streak }) {
  const ok = '<span class="terminal__ok">[ok]</span>  ';
  const pending = '<span class="terminal__muted">[..]</span>  ';
  const nameWidth = Math.max(...course.routes.map((route) => route.id.length));
  const lines = ['<span class="terminal__prompt">$</span> python3 progreso.py'];

  if (done === 0) lines.push(`${ok} entorno listo: python corre en tu navegador`);
  for (const route of course.routes) {
    const routeDone = course.doneIn(route, isDone);
    const mark = routeDone === route.total ? ok : pending;
    lines.push(
      `${mark} ${route.id.padEnd(nameWidth)} ${asciiBar(routeDone / route.total, 12)} ${routeDone}/${route.total}`,
    );
  }
  if (done > 0) lines.push(`${streak ? ok : pending} racha actual: ${plural(streak, "día")}`);
  lines.push(
    next
      ? `<span class="terminal__next">[&gt;&gt;]</span>   siguiente: ${next.route.id} · ${pad2(next.number)} · ${escapeHtml(next.title)}`
      : `${ok} todas las rutas completadas. buen trabajo.`,
  );
  lines.push('<span class="terminal__muted">[skip]</span> memorizar sintaxis sin escribir código');
  lines.push(
    '<span class="terminal__prompt">$</span> <span class="caret" aria-hidden="true"></span>',
  );
  return lines.join("\n");
}

const cta = (href, label, { primary = false, small = false } = {}) =>
  `<a class="cta${primary ? " cta--primary" : ""}${small ? " cta--small" : ""}" href="${href}"><span class="cta__label">[${escapeHtml(label)}]</span></a>`;

function actionsHtml({ next, done }) {
  if (next) {
    return (
      cta(`#l-${next.id}`, `${done ? "continuar" : "empezar"}: ${next.title}`, { primary: true }) +
      cta("#playground", "abrir playground")
    );
  }
  return cta("#playground", "abrir playground", { primary: true }) + cta("#rutas", "ver rutas");
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

function routeCardHtml(route, { course, isDone }) {
  const done = course.doneIn(route, isDone);
  const next = course.firstPending(route, isDone);
  const required = route.requires ? course.getRoute(route.requires) : null;
  const finished = done === route.total;

  const action = next
    ? cta(`#l-${next.id}`, `${done ? "continuar" : "empezar"}: ${next.title}`, {
        primary: true,
        small: true,
      })
    : cta(`#ruta-${route.id}`, "repasar la ruta", { primary: true, small: true });

  return `<article class="route-card${finished ? " route-card--done" : ""}" aria-labelledby="route-card-${route.id}">
  <div class="route-card__head">
    <span class="route-card__number">${pad2(route.index + 1)}</span>
    <h3 class="route-card__title" id="route-card-${route.id}"><a href="#ruta-${route.id}">${escapeHtml(route.title)}</a></h3>
    <span class="badge">${escapeHtml(route.level)}</span>
  </div>
  <p class="route-card__description">${escapeHtml(route.description)}</p>
  <dl class="route-card__facts">
    <div><dt>módulos</dt><dd>${route.modules.length}</dd></div>
    <div><dt>lecciones</dt><dd>${route.total}</dd></div>
    <div><dt>duración</dt><dd>~${formatDuration(route.minutes)}</dd></div>
  </dl>
  <p class="route-card__progress" aria-label="${done} de ${route.total} lecciones completadas">${asciiBar(done / route.total, 16)} <span class="route-card__count">${done}/${route.total}</span></p>
  ${required ? `<p class="route-card__requires">Antes conviene terminar «${escapeHtml(required.title)}».</p>` : ""}
  <div class="route-card__actions">${action}${cta(`#ruta-${route.id}`, "ver ruta", { small: true })}</div>
</article>`;
}
