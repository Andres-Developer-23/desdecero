# ~/desdecero.py

Curso interactivo para aprender **Python desde cero, en español**. Son 20 lecciones cortas, del primer `print()` a un juego completo. Cada lección explica una idea, trae ejemplos que se ejecutan con un clic y termina con un ejercicio que se corrige solo.

Todo funciona en el navegador. No hace falta instalar Python ni crear una cuenta.

## Qué incluye

- **Panel**: tu progreso, la siguiente lección, tu racha de días seguidos y la actividad de las últimas cuatro semanas.
- **Ruta**: 7 módulos y 20 lecciones (unas 6 horas en total).
- **Lecciones**: teoría breve, ejemplos ejecutables y un ejercicio con editor, consola, pista, solución y comprobación automática. Si el código falla, la consola explica el error en español y marca la línea en el editor.
- **Playground**: un editor libre para experimentar, con `input()` interactivo.

El progreso y el código que escribes se guardan en el navegador (`localStorage`).

| Módulo | Lecciones |
| --- | --- |
| 00 · Primeros pasos | Tu primer programa · Python como calculadora · Leer los errores sin miedo |
| 01 · Variables y tipos de datos | Variables · Tipos y conversiones · Trabajar con texto · Pedir datos con `input()` |
| 02 · Tomar decisiones | Comparaciones y lógica · `if`, `elif` y `else` |
| 03 · Repetir con bucles | `for` y `range()` · `while` · Acumular y contar |
| 04 · Listas y diccionarios | Listas · Diccionarios · Tuplas y conjuntos |
| 05 · Funciones | Crear funciones · Parámetros por defecto y alcance · Funciones con listas |
| 06 · Errores y proyecto final | `try` / `except` · Proyecto: adivina el número |

## Usarlo

Abre `index.html` en el navegador. Necesita conexión a internet la primera vez para cargar el motor de Python y el editor desde un CDN.

### Publicarlo con GitHub Pages

1. En el repositorio, ve a **Settings → Pages**.
2. En **Source**, elige **Deploy from a branch**, la rama `main` y la carpeta `/ (root)`.
3. Guarda. En uno o dos minutos la página estará en `https://<tu-usuario>.github.io/<repositorio>/`.

En una cuenta gratuita, GitHub Pages solo funciona con repositorios públicos.

## Estructura

```
index.html            página final (se genera con build.py; es la que se publica)
build.py              junta la plantilla, el curso y los estilos del editor en index.html
src/curso.txt         todo el contenido: módulos, lecciones, ejercicios y comprobaciones
src/template.html     diseño, estilos y lógica de la página
vendor/               hoja de estilos base de CodeMirror y su licencia
tests/verificar.py    comprueba en un navegador que cada ejercicio se puede resolver
```

Para cambiar el contenido, edita `src/curso.txt` o `src/template.html` y vuelve a generar la página:

```bash
python3 build.py
```

## Escribir lecciones

Todo el curso está en `src/curso.txt`, en un formato de texto sencillo:

```
=== modulo: bucles
titulo: Repetir con bucles
desc: Una frase que describe el módulo.

--- leccion: while
titulo: El bucle while
min: 15
resumen: Una línea que aparece en la ruta.
@@teoria
Texto de la lección.
@@ejercicio
Enunciado del ejercicio.
@@inicio
código con el que empieza el editor
@@solucion
código que resuelve el ejercicio
@@pista
Una pista corta.
@@comprobar
{"runs":[{"inputs":["3"],"out":"3\n2\n1\n¡Despegue!"}]}
@@test
assert alguna_variable == 42, "Mensaje que verá quien hace el ejercicio"
```

En `@@teoria` y `@@ejercicio` se puede usar un Markdown reducido: párrafos, listas con `- ` o `1. `, `**negrita**`, `*cursiva*`, `` `código` `` y bloques de código. Un bloque ` ```py ` se muestra con botón de ejecutar; un bloque ` ```txt ` se muestra como texto fijo, por ejemplo la salida esperada.

`@@comprobar` es un objeto JSON. Todas las claves son opcionales:

| Clave | Qué hace |
| --- | --- |
| `runs` | Lista de ejecuciones. Cada una puede tener `inputs` (respuestas para `input()`), `out` (salida exacta esperada), `contains` (textos que deben aparecer) y `test` (código Python extra que se ejecuta después). |
| `requiere` | Lista de `{"re": "...", "msg": "..."}`. Expresiones regulares que el código tiene que contener (sin contar los comentarios). |
| `prohibe` | Igual que `requiere`, pero el código no puede contenerlas. Sirve, por ejemplo, para evitar que se escriba el resultado a mano. |
| `omitir` | Expresión regular de líneas que se quitan antes de comprobar, como la llamada final que lanza un juego. |

El código de `@@test` se añade al final del código del alumno en la última ejecución. Lo normal es usar `assert` con un mensaje claro.

## Pruebas

`tests/verificar.py` abre la página en un navegador sin interfaz y comprueba que, en cada lección, la solución supera el ejercicio y el código de partida no.

```bash
pip install playwright
python3 -m playwright install chromium
npm install        # Skulpt y CodeMirror, para probar sin depender del CDN
npm test           # genera index.html y ejecuta la verificación
```

## Tecnología

- [Skulpt](https://skulpt.org) 1.2.0 ejecuta Python 3 dentro del navegador, sin servidor.
- [CodeMirror](https://codemirror.net/5/) 5.65.16 es el editor con resaltado de sintaxis.
- Tipografías de Google Fonts: Martian Mono, IBM Plex Sans y JetBrains Mono.

Skulpt implementa la mayor parte de Python 3, pero no todo. Por ejemplo, no admite `match` / `case`. Las 20 lecciones están probadas con él.
