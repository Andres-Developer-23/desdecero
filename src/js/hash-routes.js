/*
 * Traduce el hash de la URL a la vista que hay que mostrar.
 * Función pura: no toca el DOM y se prueba en tests/unit.
 *
 *   #panel (o vacío)  panel
 *   #rutas            panel, desplazado hasta las rutas
 *   #ruta-<id>        página de una ruta
 *   #ruta             primera ruta (enlace de la versión 1.x)
 *   #l-<id>           lección
 *   #playground       playground
 *
 * "nav" es el enlace de la cabecera que se marca como actual.
 */

export function parseHash(hash, course) {
  const name = decodeURIComponent(hash.replace(/^#/, ""));

  if (name.startsWith("l-")) {
    const lesson = course.getLesson(name.slice(2));
    if (lesson) return { view: "lesson", params: { lesson }, nav: "rutas" };
  }
  if (name.startsWith("ruta-")) {
    const route = course.getRoute(name.slice(5));
    if (route) return { view: "route", params: { route }, nav: "rutas" };
  }
  if (name === "ruta") return { view: "route", params: { route: course.routes[0] }, nav: "rutas" };
  if (name === "rutas") return { view: "panel", params: { section: "routes" }, nav: "rutas" };
  if (name === "playground") return { view: "playground", params: {}, nav: "playground" };
  return { view: "panel", params: {}, nav: "panel" };
}
