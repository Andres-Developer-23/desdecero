/*
 * Enrutado por el hash de la URL:
 *   #panel (o vacío)  panel
 *   #ruta             panel, desplazado hasta la ruta
 *   #l-<id>           lección
 *   #playground       playground
 */

import { stopPython } from "./python/engine.js";

/** Traduce un hash a una vista y sus parámetros. Función pura. */
export function parseRoute(hash, course) {
  const name = decodeURIComponent(hash.replace(/^#/, ""));
  if (name.startsWith("l-")) {
    const lesson = course.get(name.slice(2));
    if (lesson) return { view: "lesson", params: { lesson } };
  }
  if (name === "playground") return { view: "playground", params: {} };
  if (name === "ruta") return { view: "panel", params: { section: "route" } };
  return { view: "panel", params: {} };
}

/**
 * @param {object} options
 * @param {object} options.course
 * @param {Record<string, {root: HTMLElement, nav: string, title: string, show: Function, hide?: Function, refresh?: Function}>} options.views
 * @param {(view: object) => void} [options.onChange]
 */
export function createRouter({ course, views, onChange }) {
  let active = null;
  let pendingParams = null;

  function render() {
    const route = parseRoute(window.location.hash, course);
    const view = views[route.view];
    const params = { ...route.params, ...pendingParams };
    pendingParams = null;

    stopPython();
    active?.hide?.();
    for (const candidate of Object.values(views)) candidate.root.hidden = candidate !== view;
    active = view;

    view.show(params);
    document.title = view.title;
    onChange?.(view);
  }

  window.addEventListener("hashchange", render);

  return {
    start: render,

    /** Vuelve a pintar la vista actual con datos nuevos (por ejemplo, tras cambiar el progreso). */
    refresh: () => active?.refresh?.(),

    /** Navega a un hash pasando parámetros extra a la vista de destino. */
    go(hash, params) {
      pendingParams = params;
      if (window.location.hash === `#${hash}`) render();
      else window.location.hash = hash;
    },
  };
}
