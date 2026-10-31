# ~/desdecero.py

[![CI](https://github.com/Andres-Developer-23/desdecero/actions/workflows/ci.yml/badge.svg)](https://github.com/Andres-Developer-23/desdecero/actions/workflows/ci.yml)

**Pruébalo en [andres-developer-23.github.io/desdecero](https://andres-developer-23.github.io/desdecero/)**

Rutas interactivas para aprender **Python desde cero, en español**, y después **programación orientada a objetos**, apps con interfaz gráfica con **Flet**, extracción de datos de la web con **web scraping**, uso de **APIs y JSON** y creación de **APIs propias con Flask**. Cada ruta se divide en módulos y lecciones cortas: cada lección explica una idea, trae ejemplos que se ejecutan con un clic y termina con un ejercicio que se corrige solo.

Todo funciona en el navegador. No hace falta instalar Python ni crear una cuenta.

## Qué incluye

- **Panel**: tu progreso en cada ruta, la siguiente lección, tu racha de días seguidos y la actividad de las últimas cuatro semanas.
- **Rutas**: cada una con su página de módulos y lecciones, y su propio progreso.
- **Lecciones**: teoría breve, ejemplos ejecutables y un ejercicio con editor, consola, pista, solución y comprobación automática. Si el código falla, la consola explica el error en español y marca la línea en el editor.
- **Playground**: un editor libre para experimentar, con `input()` interactivo.

El progreso y el código que escribes se guardan en el navegador.

### Ruta «Python desde cero»

7 módulos y 20 lecciones (unas 6 horas), del primer `print()` a un juego completo.

| Módulo                          | Lecciones                                                                         |
| ------------------------------- | --------------------------------------------------------------------------------- |
| 00 · Primeros pasos             | Tu primer programa · Python como calculadora · Leer los errores sin miedo         |
| 01 · Variables y tipos de datos | Variables · Tipos y conversiones · Trabajar con texto · Pedir datos con `input()` |
| 02 · Tomar decisiones           | Comparaciones y lógica · `if`, `elif` y `else`                                    |
| 03 · Repetir con bucles         | `for` y `range()` · `while` · Acumular y contar                                   |
| 04 · Listas y diccionarios      | Listas · Diccionarios · Tuplas y conjuntos                                        |
| 05 · Funciones                  | Crear funciones · Parámetros por defecto y alcance · Funciones con listas         |
| 06 · Errores y proyecto final   | `try` / `except` · Proyecto: adivina el número                                    |

### Ruta «Programación orientada a objetos»

5 módulos y 12 lecciones (unas 4 horas) para organizar los programas con clases y objetos. Conviene haber terminado antes la ruta de Python. Termina con un banco completo que usa clases de datos, propiedades, herencia, composición y excepciones propias. Las comprobaciones prueban las clases del alumno con valores distintos a los del enunciado.

| Módulo                       | Lecciones                                                                                                                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 00 · Clases y objetos        | Clases y objetos · Métodos                                                                                                   |
| 01 · Métodos especiales      | Cómo se muestra un objeto · Comparar y ordenar objetos · Operadores y colecciones propias · Clases de datos con `@dataclass` |
| 02 · Encapsulamiento         | Propiedades · Atributos y métodos de clase                                                                                   |
| 03 · Herencia y polimorfismo | Herencia · Polimorfismo y clases abstractas                                                                                  |
| 04 · Proyecto final          | Composición y excepciones propias · Proyecto: un banco                                                                       |

### Ruta «Apps con Flet»

5 módulos y 12 lecciones (unas 4 horas) para crear apps con [Flet](https://flet.dev) 1.0 escribiendo solo Python. Conviene haber terminado antes la ruta de Python. Cada app se ve y se usa en una vista previa dentro de la lección, y el ejercicio se comprueba manejándola como lo haría una persona: pulsando botones, escribiendo y marcando casillas.

| Módulo                | Lecciones                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------- |
| 00 · Tu primera app   | Hola, Flet · Texto con estilo                                                                 |
| 01 · Controles        | Iconos y botones · Campos de texto y casillas                                                 |
| 02 · Layout           | Filas y columnas · Contenedores · Repartir el espacio y listas largas                         |
| 03 · Eventos y estado | Clics y actualización automática · Leer lo que escribe el usuario · Añadir y quitar controles |
| 04 · Proyecto final   | Tus propios controles · Proyecto: lista de tareas                                             |

### Ruta «Web scraping con Python»

5 módulos y 12 lecciones (unas 4 horas) para extraer datos de páginas web con requests y BeautifulSoup. Conviene haber terminado antes la ruta de Python. Los ejercicios usan una web de prácticas con cuatro sitios inventados (una librería, un refranero, un pronóstico del clima y un periódico). Cada lección tiene una pestaña **web** para ver sus páginas y su HTML, y los ejercicios comprueban también cómo se hizo: qué páginas se pidieron, con qué cabeceras y pausas, y qué archivos se guardaron.

| Módulo                 | Lecciones                                                           |
| ---------------------- | ------------------------------------------------------------------- |
| 00 · Primeros pasos    | Qué es el web scraping · HTML para scrapers y BeautifulSoup         |
| 01 · Buscar en el HTML | Buscar con `find` y `find_all` · Texto y atributos · Selectores CSS |
| 02 · Datos limpios     | De texto a números · Tablas HTML                                    |
| 03 · Recorrer un sitio | Seguir enlaces · Paginación · Scraping responsable                  |
| 04 · Proyecto final    | Guardar los datos en un CSV · Proyecto: el catálogo completo        |

### Ruta «APIs y JSON»

5 módulos y 12 lecciones (unas 3 horas) para usar APIs web desde Python. Conviene haber terminado antes la ruta de programación orientada a objetos, porque el proyecto final convierte las respuestas en clases. Los ejercicios usan cuatro APIs de práctica que se comportan como las reales: una librería con filtros y paginación, un servicio del clima con clave de acceso y límite de peticiones, un conversor de moneda y una lista de tareas con token. La pestaña **web** enseña cada petición con lo que se envió y la respuesta JSON, y los ejercicios comprueban también cómo se hizo: qué métodos y cabeceras se usaron, si se respetó el límite y cómo quedaron los datos de la API.

| Módulo                | Lecciones                                                                            |
| --------------------- | ------------------------------------------------------------------------------------ |
| 00 · JSON             | Qué es JSON · JSON anidado y archivos                                                |
| 01 · Consumir una API | Tu primera API · Parámetros de consulta · Paginación                                 |
| 02 · Claves y errores | Claves de acceso · Errores, límites y reintentos                                     |
| 03 · Enviar datos     | Crear datos con `POST` · Modificar y borrar: `PUT`, `PATCH` y `DELETE`               |
| 04 · Proyecto final   | Modelar respuestas con clases · Combinar varias APIs · Proyecto: un cliente completo |

### Ruta «Crea tu propia API con Flask»

5 módulos y 12 lecciones (unas 3 horas y media) para pasar al otro lado: crear APIs web con [Flask](https://flask.palletsprojects.com). Conviene haber terminado antes la ruta de APIs y JSON. El programa del alumno arranca su servidor con `app.run()` y lo prueba en la pestaña **web**, que puede enviar peticiones con cualquier método, datos JSON y cabeceras; la consola muestra el registro del servidor. Las comprobaciones usan `app.test_client()`, como las pruebas de un proyecto real, y en la lección de pruebas comprueban que las del alumno detectan versiones rotas de la API.

| Módulo                       | Lecciones                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| 00 · Primeros pasos          | Tu primer servidor con Flask · Rutas con variables                                     |
| 01 · Peticiones y respuestas | Leer parámetros de consulta · Respuestas JSON y códigos de estado                      |
| 02 · Recibir datos           | Recibir datos con `POST` · Validar los datos                                           |
| 03 · Una API completa        | Una API CRUD completa · Errores en JSON · Probar la API con `test_client`              |
| 04 · Proyecto final          | Proteger la API con un token · Organizar el código · Proyecto: tu propia API de tareas |

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

Las pruebas en navegador comprueban que **cada ejercicio se puede resolver** (la solución pasa y el código de partida no), que cada ejemplo de la teoría se ejecuta sin errores (salvo en la ruta de Python, que tiene errores a propósito) y los recorridos principales: ejecutar con `input()`, completar una lección, errores marcados en el editor, ejemplos, botón de detener, la vista previa de Flet y que ninguna página se desborde en móvil. Skulpt y CodeMirror se sirven desde `node_modules`, así que no dependen de la red.

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
content/                      contenido del curso: rutas, módulos y lecciones
  web/
    libreria.example/         sitios de práctica para el web scraping (HTML, CSS y robots.txt)
  api/
    api.libreria.example.json datos de las APIs de práctica (su código está en src/js/web/apis/)
  01-python/
    route.json                título, descripción, nivel y motor de la ruta
    00-primeros-pasos/
      module.json             título y descripción del módulo
      01-hola-mundo/
        lesson.md             metadatos, teoría, enunciado y pista
        starter.py            código con el que empieza el editor
        solution.py           solución de referencia
        checks.json           cómo se comprueba el ejercicio
        test.py               asserts extra (opcional)
src/
  index.html                  estructura de la página
  styles/                     estilos: variables, componentes, layout y vistas
  js/                         código de la aplicación (ver abajo)
  python/                     módulos de Python que corren en el navegador: json, abc, dataclasses y los simuladores
scripts/
  build.js                    valida el contenido y genera dist/index.html
  lib/load-course.js          lee y valida content/
```

### Código de la aplicación (`src/js/`)

| Carpeta / archivo | Responsabilidad                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------- |
| `main.js`         | Punto de entrada: crea el curso, el progreso y las vistas, y los conecta.                |
| `config.js`       | Versiones, URLs de CDN, límites de tiempo y claves de guardado.                          |
| `router.js`       | Cambia de vista según el hash de la URL.                                                 |
| `hash-routes.js`  | Traduce el hash a una vista: `#panel`, `#rutas`, `#ruta-<id>`, `#l-<id>`, `#playground`. |
| `lib/`            | Utilidades sin estado: DOM, fechas, eventos, `localStorage` y carga de scripts.          |
| `course/`         | Modelo del curso: rutas, módulos, numeración y navegación entre lecciones.               |
| `progress/`       | Lecciones completadas, racha y sincronización opcional con la cuenta.                    |
| `python/`         | Carga de Skulpt y CodeMirror, ejecución de Python y explicación de errores.              |
| `exercises/`      | Comprobación automática de los ejercicios.                                               |
| `flet/`           | Simulador de Flet: sesiones y eventos, dibujo de la vista previa y colores de Material.  |
| `web/`            | Simulador web: web de prácticas, APIs, puente con Python y navegador de la pestaña web.  |
| `ui/`             | Piezas de interfaz: terminal, editor, Markdown, ejemplos y cabecera.                     |
| `views/`          | Las pantallas: panel, ruta, lección y playground.                                        |

Las dependencias van en un solo sentido: `views` usa `ui`, `exercises`, `flet`, `web`, `python`, `progress` y `course`, y todos ellos pueden usar `lib` y `config`. Ningún módulo de `python/` o `progress/` toca el DOM.

### Simulador de Flet

[Flet](https://flet.dev) dibuja la interfaz con Flutter, demasiado pesado para cargarlo en la página. Por eso los ejercicios de Flet se ejecutan con un simulador:

1. `src/python/flet/` es un módulo `flet` escrito en Python con la API de Flet 1.0: `ft.run(main)`, `page.add(...)`, controles (`Text`, `Icon`, `Button` y variantes, `IconButton`, `FloatingActionButton`, `TextField`, `Checkbox`, `Switch`, `Slider`, `ProgressBar`, `Row`, `Column`, `Container`, `ListView`, `Card`, `ListTile`, `Divider`, `SafeArea`, `AppBar`), valores (`Colors`, `Icons`, `Padding`, `Margin`, `Border`, `BorderRadius`, `Alignment`…) y controles propios con `@ft.control` y `dataclasses.field`.
2. Skulpt lo ejecuta junto al código del alumno. Al terminar `main()` y cada manejador de eventos, el simulador describe el árbol de controles y lo envía a la página por el módulo `_flet_bridge` (como Flet 1.0, la interfaz se actualiza sola).
3. `src/js/flet/renderer.js` lo dibuja con aspecto de Material 3 y devuelve los eventos (clic, escribir, Enter, marcar) a Python.

Lo que no está implementado da un error claro en español, y los nombres que Flet 1.0 eliminó (`ft.app`, `ft.ElevatedButton`, `ft.padding.all`, `ft.alignment.center`…) explican cómo se escriben ahora. Fuera del alcance del simulador quedan la navegación entre vistas, los diálogos, las imágenes y el empaquetado.

### Simulador web: scraping, APIs y Flask

Desde la página no se puede descargar una web real: el navegador bloquea las peticiones a otros dominios. Las rutas de scraping, de APIs y de Flask usan un **internet de prácticas** con el dominio reservado `.example`, que nunca apunta a una web real:

- **Sitios de práctica**: los archivos de `content/web/` se sirven como si fueran sitios de verdad (`content/web/libreria.example/catalogo/pagina-2.html` responde en `https://libreria.example/catalogo/pagina-2.html`). Solo admiten `GET` y `HEAD`.
- **APIs de práctica** (`src/js/web/apis/`, con sus datos en `content/api/`), que responden JSON con los códigos y cabeceras de una API REST real:

| API                    | Qué enseña                                                                                                  |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| `api.libreria.example` | El catálogo de la librería: filtros, orden y paginación con enlaces `siguiente` y `anterior`.               |
| `api.clima.example`    | Clave de acceso en `X-API-Key` (401 y 403) y límite de 5 peticiones cada 10 s (429 con `Retry-After`).      |
| `api.cambio.example`   | Tasas de cambio y conversiones con parámetros de consulta.                                                  |
| `api.tareas.example`   | Token con `POST /v1/token`, `Authorization: Bearer`, `POST`, `PUT`, `PATCH`, `DELETE` y validación con 422. |

Las APIs guardan estado (las tareas creadas, las peticiones que cuentan para el límite) solo durante una ejecución: cada programa empieza con los datos de `content/api/`.

En Python:

- `src/python/requests/` tiene la API de requests: `get`, `post`, `put`, `patch`, `delete`, `head`, `Session`, `params=`, `headers=`, `json=`, `data=`, `timeout=`, `Response.json()`, `raise_for_status()` y sus excepciones. Redirige `http://` y las carpetas sin barra final, y explica en español que no puede salir del internet de prácticas.
- `src/python/json/` es el módulo `json` (`loads`, `dumps`, `load`, `dump`, `JSONDecodeError`) con los resultados y mensajes de error de CPython. El texto se analiza en JavaScript (`src/js/python/json-parse.js`), que es mucho más rápido que hacerlo en Skulpt.
- `src/python/bs4/` es BeautifulSoup 4: el HTML lo analiza el `DOMParser` del navegador y Python recorre el árbol con `find`, `find_all`, `get_text`, atributos, padres y hermanos. `select` y `select_one` usan `querySelectorAll`, así que admiten cualquier selector CSS.
- También están `urllib.parse`, `urllib.robotparser` y `csv`, que Skulpt no trae, y un `open()` con un disco simulado que empieza vacío en cada ejecución. Al terminar, la consola enseña los archivos guardados.
- Al importar requests, `time.sleep()` avanza un reloj simulado en lugar de esperar. Cada petición queda anotada con su método, su hora, sus cabeceras, sus datos y su estado.

**Flask** (`src/python/flask/` y `src/python/werkzeug/`) tiene la API de Flask 3 para crear APIs: `Flask`, `@app.route` y `@app.get`/`post`/`put`/`patch`/`delete`, convertidores (`<int:id>`, `<float:x>`, `<path:p>`), `request` (`args`, `get_json()`, `form`, `headers`, `authorization`), respuestas desde `str`, `dict`, `list`, tuplas y `Response`, `jsonify`, `abort`, `@app.errorhandler`, `url_for`, `redirect`, `make_response` y `app.test_client()`. Da los mismos códigos, cabeceras, JSON (claves ordenadas, `ensure_ascii` y sangría en modo debug) y páginas de error que Flask 3.1: se comprobó comparando las respuestas con las de Flask en dos baterías de casos.

La diferencia está en `app.run()`: no se queda esperando. Deja el servidor en marcha en `http://127.0.0.1:5000` hasta la siguiente ejecución (`src/js/web/local-server.js`), y la pestaña **web** le envía las peticiones. La consola muestra el registro de cada una, como el servidor de desarrollo, y un error en una vista responde 500 y se explica en español con su línea. Dentro del programa, el servidor se prueba con `app.test_client()`, que es también lo que usan las comprobaciones.

`src/js/web/web-viewer.js` es el navegador de la pestaña **web** de las lecciones (y del playground). Lista las peticiones del último programa y, para cada una, enseña lo que se envió y lo que respondió el servidor: la página tal como se ve o como su código HTML, o el JSON con sangría y colores. Su barra de dirección hace peticiones con cualquier método, y con datos JSON y cabeceras, usando una sesión aparte: explorar no cambia lo que vio el programa.

## Escribir lecciones

El contenido se organiza en tres niveles de carpetas `NN-id`: rutas, módulos y lecciones. El número da el orden y el resto es el identificador. El de la ruta aparece en su URL (`#ruta-python`) y el de la lección en la suya (`#l-hola-mundo`); los identificadores de lección no se pueden repetir, tampoco entre rutas. El build se detiene con un mensaje claro si falta un archivo o algo no es válido.

### `route.json`

```json
{
  "title": "Python desde cero",
  "description": "Una o dos frases sobre lo que se aprende.",
  "level": "Principiante",
  "runtime": "python",
  "requires": "otra-ruta"
}
```

`runtime` indica con qué se ejecutan los ejercicios de la ruta. `requires` es opcional: el identificador de una ruta que conviene terminar antes, y aparece como recomendación en el panel.

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

Se admite un Markdown reducido: párrafos, subtítulos con `### `, listas con `- ` o `1. ` (sin anidar), `**negrita**`, `*cursiva*`, `` `código` ``, `[enlaces](https://...)` y bloques de código. Un bloque ` ```py ` se muestra con botón de ejecutar; ` ```txt ` se muestra como texto fijo, por ejemplo la salida esperada. Los enlaces a la web de prácticas (`https://libreria.example/`) se abren en la pestaña web de la lección.

En las rutas del simulador web, la clave opcional `web` de los metadatos indica la página o la dirección de una API que se abre al entrar en la lección (`web: https://libreria.example/` o `web: https://api.libreria.example/v1/libros`). En las de Flask puede ser una dirección del servidor del alumno (`web: http://127.0.0.1:5000/tareas`): se abre cuando su programa lo arranca.

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

En las rutas de Flet, `test.py` usa el módulo `fletsim` para manejar la app como lo haría una persona:

```python
from fletsim import *

campo = find_one(ft.TextField)
type_text(campo, "Ana")          # escribir en un campo
click("Saludar")                 # clic en el botón con ese texto
assert "Hola, Ana" in texts(), "Al pulsar Saludar debería aparecer «Hola, Ana»"
```

| Función                     | Qué hace                                                                     |
| --------------------------- | ---------------------------------------------------------------------------- |
| `page()`                    | La página de la app (falla si el programa no llamó a `ft.run(main)`).        |
| `find(tipo, **props)`       | Controles visibles de un tipo cuyas propiedades coinciden.                   |
| `find_one(tipo, **props)`   | El primero, o un error que explica qué falta.                                |
| `texts()` / `screen_text()` | Los `ft.Text` visibles / todo el texto visible (textos, botones, casillas…). |
| `click(control_o_texto)`    | Clic en un control o en el botón con ese texto.                              |
| `type_text(campo, texto)`   | Escribe en un `TextField` (lanza `on_change`).                               |
| `submit(campo)`             | Pulsa Enter en un `TextField` (lanza `on_submit`).                           |
| `toggle(casilla)`           | Marca o desmarca un `Checkbox` o un `Switch`.                                |

En las rutas del simulador web, `test.py` usa el módulo `websim` para revisar qué hizo el programa:

| Función                       | Qué devuelve                                                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| `peticiones()`                | Las peticiones, en orden: `{"metodo", "url", "estado", "segundo", "cabeceras", "cuerpo", "timeout"}`. |
| `peticiones_a(metodo, texto)` | Las peticiones con ese método cuya URL contiene el texto.                                             |
| `datos_enviados(peticion)`    | Los datos JSON que envió una petición (o `None`).                                                     |
| `estado_api(dominio)`         | Los datos de una API al terminar el programa (p. ej. las tareas).                                     |
| `urls_pedidas()`              | Solo las URL, en orden y con repeticiones.                                                            |
| `pausas()`                    | Segundos entre una petición y la siguiente (según el reloj simulado).                                 |
| `cabecera(peticion, nombre)`  | El valor de una cabecera de una petición, sin distinguir mayúsculas.                                  |
| `archivos()` / `leer(nombre)` | Los archivos que guardó el programa / el texto de uno (o un error que lo explica).                    |
| `filas_csv(nombre)`           | Las filas de un CSV guardado, como diccionarios.                                                      |

## Contribuir

Cada cambio empieza con un issue, se hace en su propia rama y entra en `main` con un pull request que pasa la CI. Los commits se escriben en español y las versiones siguen el versionado semántico. Todo el proceso está en [CONTRIBUTING.md](CONTRIBUTING.md) y la lista de cambios por versión en [CHANGELOG.md](CHANGELOG.md).

## Tecnología

- [Skulpt](https://skulpt.org) 1.2 ejecuta Python 3 dentro del navegador, sin servidor.
- [CodeMirror](https://codemirror.net/5/) 5 es el editor con resaltado de sintaxis.
- La vista previa de Flet usa Roboto y Material Icons de Google Fonts.
- [esbuild](https://esbuild.github.io) empaqueta el JavaScript y los estilos.
- Tipografías de Google Fonts: Martian Mono, IBM Plex Sans y JetBrains Mono.

Skulpt implementa la mayor parte de Python 3, pero no todo. Por ejemplo, no admite `match` / `case`, `nonlocal` ni `eval`, y no trae los módulos `json`, `abc`, `typing`, `dataclasses`, `functools`, `csv` ni `urllib.parse`. El curso aporta versiones propias de `json`, `abc`, `dataclasses`, `functools` y `typing` (en todas las rutas) y de `csv`, `urllib.parse`, `urllib.robotparser`, `flask` y `werkzeug` (simulador web).

`src/js/python/skulpt-patches.js` corrige además algunas diferencias con CPython: `str.title()` con tildes, el mensaje de las excepciones propias (`super().__init__(mensaje)`), `super()` cuando la clase base tiene `__str__`, las anotaciones sin valor (`nombre: str`), `list[str]`, un fallo por el que un `import` podía perder el módulo si Skulpt hacía una pausa en mitad y otro por el que `x in objeto` daba siempre `True` si el `__contains__` del objeto tenía un bucle.
