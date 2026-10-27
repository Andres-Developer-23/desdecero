# Registro de cambios

Todos los cambios importantes del proyecto se anotan aquí. El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y el proyecto usa [versionado semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Corregido

- Dependabot ya no propone versiones mayores de CodeMirror y Skulpt, que la página no admite, y las demás versiones mayores llegan por separado en lugar de bloquear el resto de actualizaciones.

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

[Sin publicar]: https://github.com/Andres-Developer-23/desdecero/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Andres-Developer-23/desdecero/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Andres-Developer-23/desdecero/releases/tag/v1.0.0
