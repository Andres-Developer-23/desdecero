/*
 * Navegación entre vistas según el hash de la URL (ver hash-routes.js).
 */

import { parseHash } from "./hash-routes.js";
import { stopPython } from "./python/engine.js";

/**
 * @param {object} options
 * @param {object} options.course
 * @param {Record<string, {root: HTMLElement, title: string, show: Function, hide?: Function, refresh?: Function}>} options.views
 * @param {(route: ReturnType<typeof parseHash>) => void} [options.onChange]
 */
export function createRouter({ course, views, onChange }) {
  let active = null;
  let pendingParams = null;

  function render() {
    const route = parseHash(window.location.hash, course);
    const view = views[route.view];
    const params = { ...route.params, ...pendingParams };
    pendingParams = null;

    stopPython();
    active?.hide?.();
    for (const candidate of Object.values(views)) candidate.root.hidden = candidate !== view;
    active = view;

    view.show(params);
    document.title = view.title;
    onChange?.(route);
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
