/*
 * Vista de proyectos: el catálogo, con filtros por nivel y por tema. Cada
 * tarjeta dice el estado del alumno (sin empezar, en curso o completado)
 * donde un catálogo con cuentas pondría cuánta gente lo empezó.
 */

import { STORAGE_KEYS } from "../config.js";
import { PROJECT_LEVELS, filterProjects } from "../course/course.js";
import { $, escapeHtml } from "../lib/dom.js";
import { storage } from "../lib/storage.js";
import { asciiBar, formatDuration } from "../ui/format.js";

/**
 * @param {object} deps
 * @param {ReturnType<import("../course/course.js").createCourse>} deps.course
 * @param {ReturnType<import("../progress/progress.js").createProgress>} deps.progress
 */
export function createProjectsView({ course, progress }) {
  const root = $("#view-projects");
  const elements = {
    progress: $("#projects-progress"),
    levels: $("#projects-levels"),
    tags: $("#projects-tags"),
    grid: $("#projects-grid"),
    empty: $("#projects-empty"),
  };
  const projects = course.projects;
  const tags = [...new Set(projects.flatMap((project) => project.tags))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  const saved = storage.getJSON(STORAGE_KEYS.projectFilters) ?? {};
  const filters = {
    level: PROJECT_LEVELS.includes(saved.level) ? saved.level : null,
    tag: tags.includes(saved.tag) ? saved.tag : null,
  };

  const started = (project) => storage.get(STORAGE_KEYS.draft(project.id)) != null;

  /** Un botón de filtro. Si no hay ningún proyecto de ese nivel o tema, no se puede pulsar. */
  function filterButton(kind, value, label, count) {
    const active = filters[kind] === value;
    return `<button type="button" class="filter${active ? " filter--active" : ""}" data-filter="${kind}" data-value="${escapeHtml(value ?? "")}" aria-pressed="${active}"${count === 0 ? " disabled" : ""}>${escapeHtml(label)}${count == null ? "" : ` <span class="filter__count">${count}</span>`}</button>`;
  }

  function render() {
    const done = course.projectsDone(progress.isDone);
    elements.progress.innerHTML = `${asciiBar(projects.length ? done / projects.length : 0, 16)} <span class="route-card__count">${done}/${projects.length}</span> proyectos completados`;

    const byLevel = (level) => projects.filter((project) => project.level === level).length;
    elements.levels.innerHTML = [
      filterButton("level", null, "todos"),
      ...PROJECT_LEVELS.map((level) => filterButton("level", level, level, byLevel(level))),
    ].join("");
    elements.tags.innerHTML = [
      ...tags.map((tag) =>
        filterButton("tag", tag, tag, projects.filter((p) => p.tags.includes(tag)).length),
      ),
      filters.level || filters.tag
        ? '<button type="button" class="filter filter--clear" data-filter="clear">× limpiar filtros</button>'
        : "",
    ].join("");

    const visible = filterProjects(projects, filters);
    elements.grid.innerHTML = visible.map((project) => cardHtml(project)).join("");
    elements.empty.hidden = visible.length > 0;
  }

  function cardHtml(project) {
    const done = progress.isDone(project.id);
    const status = done
      ? '<span class="project-card__status project-card__status--done">✓ completado</span>'
      : started(project)
        ? '<span class="project-card__status project-card__status--started">● en curso</span>'
        : '<span class="project-card__status">sin empezar</span>';
    const required = project.requires ? course.getRoute(project.requires) : null;
    return `<article class="project-card${done ? " project-card--done" : ""}" aria-labelledby="project-card-${project.id}">
  <div class="project-card__head">
    <span class="level level--${project.level}">${escapeHtml(project.level)}</span>
    <span class="project-card__tags">${project.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</span>
  </div>
  <h3 class="project-card__title" id="project-card-${project.id}"><a href="#p-${project.id}">${escapeHtml(project.title)}</a></h3>
  <p class="project-card__summary">${escapeHtml(project.summary)}</p>
  <p class="project-card__facts">${status}<span>~${formatDuration(project.minutes)}</span>${required ? `<span>usa: ${escapeHtml(required.title)}</span>` : ""}</p>
</article>`;
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    const kind = button.dataset.filter;
    if (kind === "clear") {
      filters.level = null;
      filters.tag = null;
    } else {
      const value = button.dataset.value || null;
      // Pulsar el filtro activo lo quita.
      filters[kind] = filters[kind] === value ? null : value;
    }
    storage.setJSON(STORAGE_KEYS.projectFilters, filters);
    render();
  });

  return {
    root,
    title: "Proyectos · Python desde Cero",
    show() {
      render();
      window.scrollTo(0, 0);
    },
    refresh: render,
  };
}
