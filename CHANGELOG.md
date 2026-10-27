# Registro de cambios

Todos los cambios importantes del proyecto se anotan aquí. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

## [Sin publicar]

## [1.2.0] - 2026-10-27

### Añadido

- Ruta «Apps con Flet»: 12 lecciones en 5 módulos para crear apps con interfaz gráfica con la API de Flet 1.0, de la primera ventana a una lista de tareas completa.
- Simulador de Flet 1.0 que corre en el navegador: las apps se ven y se usan en una vista previa, con controles de Material 3, eventos y controles propios con `@ft.control`. Los nombres que Flet 1.0 eliminó explican cómo se escriben ahora.
- Módulo `fletsim` para comprobar ejercicios de Flet como lo haría una persona: pulsar botones, escribir, pulsar Enter y marcar casillas.
- Vista previa de Flet en las lecciones (con pestañas de vista previa y salida), en los ejemplos de la teoría y en el playground.
- Pruebas que ejecutan cada ejemplo de Flet de la teoría y que buscan desbordamiento horizontal en todas las páginas.

### Cambiado

- El curso se organiza en rutas de aprendizaje, cada una con su página de módulos, su progreso y su numeración de lecciones. Las rutas se describen en `content/<ruta>/route.json` y pueden pedir que se termine otra antes.
- El panel muestra una tarjeta por ruta y sugiere la siguiente lección de la ruta empezada.
- Los enlaces `#ruta` de las versiones anteriores llevan a la primera ruta.

### Actualizado

- Acciones de GitHub: `actions/checkout`, `actions/setup-node` y `actions/upload-artifact` a la versión 7, `actions/configure-pages` a la 6, y `actions/upload-pages-artifact` y `actions/deploy-pages` a la 5 (#13).
- Dependencias de desarrollo: `@playwright/test` 1.64.1, `codemirror` 5.65.21, `esbuild` 0.28.2, `prettier` 3.9.10 y `yaml` 2.9.1 (#17).
- ESLint 10: `eslint` 10.13.0 y `@eslint/js` 10.0.1 (#18, #20), y `globals` 17.13.0 (#19).

### Corregido

- Dependabot ya no propone versiones mayores de CodeMirror y Skulpt, que la página no admite, y las demás versiones mayores llegan por separado en lugar de bloquear el resto de actualizaciones.
- El código en línea largo de las lecciones ya no desborda la página en el móvil.

## [1.1.0] - 2026-10-27

### Cambiado

- El contenido del curso pasa de un único archivo de texto a una carpeta por lección en `content/`, con el código Python en archivos `.py`.
- El JavaScript se divide en módulos con una responsabilidad cada uno (`src/js/`) y los estilos en archivos por componente y vista (`src/styles/`), con nombres de clase BEM.
- La página se genera con esbuild en `dist/index.html`. El build valida el contenido y explica cada problema con la ruta del archivo.
- El progreso se guarda con un formato nuevo (`pdc:progress:v2`). El de la versión 1.0.0 se migra solo.

### Añadido

- Pruebas unitarias con `node:test` y pruebas en navegador con Playwright, en escritorio y móvil, incluida una que comprueba que los 20 ejercicios se pueden resolver.
- ESLint, Prettier y `.editorconfig`.
- Integración continua con GitHub Actions y publicación automática en GitHub Pages.
- Dependabot para las dependencias de npm y las acciones de GitHub.
- Guía de contribución, plantillas de issues y de pull request, y este registro de cambios.

### Corregido

- Los borradores del editor podían guardarse en la lección equivocada si se cambiaba de lección justo después de escribir.

### Eliminado

- La copia de seguridad del código antes de ver la solución, que no se podía recuperar desde la interfaz.

## [1.0.0] - 2026-10-27

### Añadido

- Primera versión del curso: 20 lecciones en 7 módulos, del primer `print()` a un juego completo.
- Ejemplos ejecutables y ejercicios con comprobación automática, pista y solución.
- Consola con `input()` interactivo y errores explicados en español.
- Playground libre y progreso guardado en el navegador.

[Sin publicar]: https://github.com/Andres-Developer-23/desdecero/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/Andres-Developer-23/desdecero/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Andres-Developer-23/desdecero/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Andres-Developer-23/desdecero/releases/tag/v1.0.0
