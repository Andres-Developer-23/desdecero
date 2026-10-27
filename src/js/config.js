/*
 * Configuración central de la aplicación.
 *
 * Las versiones de Skulpt y CodeMirror se inyectan en el build desde
 * package.json, así solo hay un sitio donde cambiarlas.
 */

export const SKULPT_VERSION = __SKULPT_VERSION__;
export const CODEMIRROR_VERSION = __CODEMIRROR_VERSION__;

/** URLs de un archivo de Skulpt: CDN principal y alternativo. */
export function skulptUrls(file) {
  return [
    `https://cdn.jsdelivr.net/npm/skulpt@${SKULPT_VERSION}/dist/${file}`,
    `https://unpkg.com/skulpt@${SKULPT_VERSION}/dist/${file}`,
  ];
}

/** URLs de una parte de CodeMirror (por ejemplo "mode/python/python"). */
export function codemirrorUrls(part) {
  const npmPath = part === "codemirror" ? "lib/codemirror" : part;
  return [
    `https://cdnjs.cloudflare.com/ajax/libs/codemirror/${CODEMIRROR_VERSION}/${part}.min.js`,
    `https://cdn.jsdelivr.net/npm/codemirror@${CODEMIRROR_VERSION}/${npmPath}.js`,
  ];
}

/** Complementos de CodeMirror que se cargan después del núcleo. */
export const CODEMIRROR_ADDONS = [
  "mode/python/python",
  "addon/edit/matchbrackets",
  "addon/edit/closebrackets",
  "addon/runmode/runmode",
];

/** Tiempo máximo de ejecución antes de detener un programa, en milisegundos. */
export const TIME_LIMIT_MS = {
  lesson: 6000,
  check: 4000,
  playground: 8000,
};

/** Cuánto esperar a CodeMirror antes de usar el editor de texto simple. */
export const EDITOR_LOAD_TIMEOUT_MS = 6000;

/** Claves de localStorage. */
export const STORAGE_KEYS = {
  progress: "pdc:progress:v2",
  legacyProgress: "pdc:progreso:v1",
  playground: "pdc:playground",
  draft: (lessonId) => `pdc:codigo:${lessonId}`,
};
