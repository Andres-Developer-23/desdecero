# ~/desdecero.py

[![CI](https://github.com/Andres-Developer-23/desdecero/actions/workflows/ci.yml/badge.svg)](https://github.com/Andres-Developer-23/desdecero/actions/workflows/ci.yml)

**Pruébalo en [andres-developer-23.github.io/desdecero](https://andres-developer-23.github.io/desdecero/)**

Curso interactivo para aprender **Python desde cero, en español**. Son 20 lecciones cortas, del primer `print()` a un juego completo. Cada lección explica una idea, trae ejemplos que se ejecutan con un clic y termina con un ejercicio que se corrige solo.

Todo funciona en el navegador. No hace falta instalar Python ni crear una cuenta.

## Qué incluye

- **Panel**: tu progreso, la siguiente lección, tu racha de días seguidos y la actividad de las últimas cuatro semanas.
- **Ruta**: 7 módulos y 20 lecciones (unas 6 horas en total).
- **Lecciones**: teoría breve, ejemplos ejecutables y un ejercicio con editor, consola, pista, solución y comprobación automática. Si el código falla, la consola explica el error en español y marca la línea en el editor.
- **Playground**: un editor libre para experimentar, con `input()` interactivo.

El progreso y el código que escribes se guardan en el navegador.

| Módulo                          | Lecciones                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------- |
| 00 · Primeros pasos             | Tu primer programa · Python como calculadora · Leer los errores sin miedo         |
| 01 · Variables y tipos de datos | Variables · Tipos y conversiones · Trabajar con texto · Pedir datos con `input()` |
| 02 · Tomar decisiones           | Comparaciones y lógica · `if`, `elif` y `else`                                    |
| 03 · Repetir con bucles         | `for` y `range()` · `while` · Acumular y contar                                   |
| 04 · Listas y diccionarios      | Listas · Diccionarios · Tuplas y conjuntos                                        |
| 05 · Funciones                  | Crear funciones · Parámetros por defecto y alcance · Funciones con listas         |
| 06 · Errores y proyecto final   | `try` / `except` · Proyecto: adivina el número                                    |

## Desarrollo local

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
npm install      # instala las dependencias de desarrollo
npm run build    # genera dist/index.html
```

`dist/index.html` es la página completa en un solo archivo: puedes abrirla directamente en el navegador o subirla a cualquier hosting estático. La primera vez necesita conexión para descargar el motor de Python y el editor.

## Pruebas y calidad

```bash
npx playwright install chromium   # solo la primera vez
npm run check                     # formato + lint + todas las pruebas
```

| Comando             | Qué hace                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `npm run lint`      | Revisa el JavaScript con ESLint.                                                            |
| `npm run format`    | Formatea el código con Prettier (`format:check` solo comprueba).                            |
| `npm run test:unit` | Pruebas unitarias con `node:test`: fechas, racha, progreso, Markdown y carga del contenido. |
| `npm run test:e2e`  | Genera la página y la prueba en Chromium con Playwright, en escritorio y en móvil.          |
| `npm test`          | Las dos anteriores.                                                                         |

Las pruebas en navegador comprueban que **cada ejercicio se puede resolver** (la solución pasa y el código de partida no) y los recorridos principales: ejecutar con `input()`, completar una lección, errores marcados en el editor, ejemplos, botón de detener y que nada se desborde en móvil. Skulpt y CodeMirror se sirven desde `node_modules`, así que no dependen de la red.

```
tests/
  unit/        pruebas de funciones puras (node:test)
  e2e/         pruebas en navegador (Playwright)
```

## Integración continua y publicación

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) se ejecuta en cada pull request y en cada cambio en `main`:

1. **Verificar**: formato, lint, pruebas unitarias y pruebas en navegador. Si algo falla, guarda el informe de Playwright como artefacto durante 7 días.
2. **Publicar**: solo en `main` y solo si la verificación pasa. Genera `dist/` y lo despliega en GitHub Pages.

Para que la publicación funcione, en el repositorio ve a **Settings → Pages** y en **Source** elige **GitHub Actions** (solo hay que hacerlo una vez).

Dependabot propone una vez al mes un pull request con las dependencias de npm y las acciones de GitHub actualizadas.

## Estructura del proyecto

```
content/                      contenido del curso, una carpeta por lección
  00-primeros-pasos/
    module.json               título y descripción del módulo
    01-hola-mundo/
      lesson.md               metadatos, teoría, enunciado y pista
      starter.py              código con el que empieza el editor
      solution.py             solución de referencia
      checks.json             cómo se comprueba el ejercicio
      test.py                 asserts extra (opcional)
src/
  index.html                  estructura de la página
  styles/                     estilos: variables, componentes, layout y vistas
  js/                         código de la aplicación (ver abajo)
scripts/
  build.js                    valida el contenido y genera dist/index.html
  lib/load-course.js          lee y valida content/
```

### Código de la aplicación (`src/js/`)

| Carpeta / archivo | Responsabilidad                                                                 |
| ----------------- | ------------------------------------------------------------------------------- |
| `main.js`         | Punto de entrada: crea el curso, el progreso y las vistas, y los conecta.       |
| `config.js`       | Versiones, URLs de CDN, límites de tiempo y claves de guardado.                 |
| `router.js`       | Navegación por el hash de la URL (`#panel`, `#l-<lección>`, `#playground`).     |
| `lib/`            | Utilidades sin estado: DOM, fechas, eventos, `localStorage` y carga de scripts. |
| `course/`         | Modelo del curso: numeración y navegación entre lecciones.                      |
| `progress/`       | Lecciones completadas, racha y sincronización opcional con la cuenta.           |
| `python/`         | Carga de Skulpt y CodeMirror, ejecución de Python y explicación de errores.     |
| `exercises/`      | Comprobación automática de los ejercicios.                                      |
| `ui/`             | Piezas de interfaz: terminal, editor, Markdown, ejemplos y cabecera.            |
| `views/`          | Las tres pantallas: panel, lección y playground.                                |

Las dependencias van en un solo sentido: `views` usa `ui`, `exercises`, `python`, `progress` y `course`, y todos ellos pueden usar `lib` y `config`. Ningún módulo de `python/` o `progress/` toca el DOM.

## Escribir lecciones

Cada lección es una carpeta `NN-id` dentro de su módulo. El número da el orden y el resto es el identificador que aparece en la URL (`#l-hola-mundo`). El build se detiene con un mensaje claro si falta un archivo o algo no es válido.

### `lesson.md`

```markdown
---
title: El bucle while
minutes: 15
summary: Repetir mientras se cumpla una condición.
---

Teoría de la lección.

## Ejercicio

Enunciado del ejercicio.

## Pista

Una pista corta.
```

Se admite un Markdown reducido: párrafos, listas con `- ` o `1. `, `**negrita**`, `*cursiva*`, `` `código` `` y bloques de código. Un bloque ` ```py ` se muestra con botón de ejecutar; ` ```txt ` se muestra como texto fijo, por ejemplo la salida esperada.

### `checks.json`

Todas las claves son opcionales:

| Clave      | Qué hace                                                                                                                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `runs`     | Lista de ejecuciones. Cada una puede tener `inputs` (respuestas para `input()`), `output` (salida exacta esperada), `contains` (textos que deben aparecer) y `test` (código Python extra que se ejecuta después). |
| `requires` | Lista de `{ "pattern": "...", "message": "..." }`: expresiones regulares que el código tiene que contener, sin contar los comentarios.                                                                            |
| `forbids`  | Igual que `requires`, pero el código no puede contenerlas. Sirve, por ejemplo, para evitar que se escriba el resultado a mano.                                                                                    |
| `ignore`   | Expresión regular de líneas que se quitan antes de comprobar, como la llamada final que lanza un juego.                                                                                                           |

```json
{
  "requires": [{ "pattern": "\\bwhile\\b", "message": "Usa un bucle while." }],
  "runs": [{ "inputs": ["3"], "output": "3\n2\n1\n¡Despegue!" }]
}
```

### `test.py`

Código que se añade al final del código del alumno en la última ejecución. Lo normal es usar `assert` con un mensaje claro, que es lo que verá el alumno si falla:

```python
assert total == 13700, "total debería valer 13700"
```

## Contribuir

Cada cambio empieza con un issue, se hace en su propia rama y entra en `main` con un pull request que pasa la CI. Los commits se escriben en español y las versiones siguen el versionado semántico. Todo el proceso está en [CONTRIBUTING.md](CONTRIBUTING.md) y la lista de cambios por versión en [CHANGELOG.md](CHANGELOG.md).

## Tecnología

- [Skulpt](https://skulpt.org) 1.2 ejecuta Python 3 dentro del navegador, sin servidor.
- [CodeMirror](https://codemirror.net/5/) 5 es el editor con resaltado de sintaxis.
- [esbuild](https://esbuild.github.io) empaqueta el JavaScript y los estilos.
- Tipografías de Google Fonts: Martian Mono, IBM Plex Sans y JetBrains Mono.

Skulpt implementa la mayor parte de Python 3, pero no todo. Por ejemplo, no admite `match` / `case`.
