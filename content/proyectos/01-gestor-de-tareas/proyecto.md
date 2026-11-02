---
title: Gestor de tareas
level: principiante
tags: [CLI, Archivos, JSON]
minutes: 60
runtime: python
requires: python
file: tareas.py
cli: true
summary: "Un programa de terminal para apuntar, actualizar y listar tus tareas, que las guarda en un archivo JSON."
---

Vas a construir un **gestor de tareas de línea de comandos**: un programa que se usa desde la terminal, escribiendo órdenes, para apuntar lo que tienes que hacer, marcar lo que ya está en curso o hecho y ver la lista. Las tareas se guardan en un archivo JSON, así que siguen ahí la próxima vez que abras el programa.

Es un proyecto pequeño, pero practica cosas que usarás en cualquier programa de verdad: leer los **argumentos** de la terminal, **guardar y cargar datos** de un archivo y avisar bien de los **errores** de quien lo usa.

### Requisitos

El programa se llama `tareas.py` y entiende estas órdenes:

- `agregar "descripción"`: apunta una tarea nueva, pendiente.
- `actualizar <id> "descripción"`: cambia la descripción de una tarea.
- `eliminar <id>`: borra una tarea.
- `en-curso <id>` y `hecha <id>`: cambian el estado de una tarea.
- `listar`: enseña todas las tareas. `listar pendientes`, `listar en-curso` y `listar hechas` enseñan solo las de ese estado.
- Sin órdenes, enseña cómo se usa.

### Ejemplo

```txt
$ python tareas.py agregar "Comprar pan"
Tarea agregada (id: 1)
$ python tareas.py agregar "Llamar a la abuela"
Tarea agregada (id: 2)
$ python tareas.py en-curso 1
Tarea 1: en curso
$ python tareas.py hecha 2
Tarea 2: hecha
$ python tareas.py listar
[~] 1 · Comprar pan
[x] 2 · Llamar a la abuela
$ python tareas.py eliminar 7
Error: No existe la tarea 7
```

### Propiedades de cada tarea

Cada tarea es un diccionario con estas claves, y `tareas.json` guarda la lista de tareas:

- `id`: un número que la identifica. Una tarea nueva tiene el mayor id que haya más 1 (o 1 si no hay ninguna).
- `descripcion`: el texto de la tarea.
- `estado`: `"pendiente"`, `"en-curso"` o `"hecha"`.
- `creada` y `actualizada`: la fecha y la hora en que se creó y en que cambió por última vez, como `"2026-10-27 18:30:00"`.

### Restricciones

- Solo la biblioteca estándar: `sys` para los argumentos, `json` para el archivo y `datetime` para las fechas. Nada de librerías externas.
- El archivo `tareas.json` está en la carpeta donde se ejecuta el programa. Si no existe, el programa empieza con la lista vacía, y lo crea al guardar la primera tarea.
- Los errores de quien usa el programa (una orden que no existe, un id que no es un número, una tarea que no existe, falta la descripción) se explican con un mensaje claro, sin que el programa se rompa con un error de Python.

### Cómo empezar

Los argumentos que escribes después del nombre del programa llegan en la lista `sys.argv`: el primer elemento es el nombre del programa y el resto, los argumentos, siempre como texto. Las comillas sirven para que un argumento tenga espacios:

```txt
$ python tareas.py agregar "Comprar pan"
sys.argv == ["tareas.py", "agregar", "Comprar pan"]
```

En el curso, escribe los argumentos en la línea `$ python tareas.py` que hay debajo del editor y pulsa **ejecutar** (o Enter en esa línea). Como en un ordenador, los archivos que guarda el programa siguen ahí en la siguiente ejecución; el botón **vaciar disco** los borra para empezar de cero.

Para leer y guardar la lista, `json.load` y `json.dump` hacen todo el trabajo. Si el archivo todavía no existe, `open` lanza `FileNotFoundError`: captúralo con `try` / `except` y empieza con una lista vacía.

En los programas de terminal, los errores se suelen escribir en la **salida de errores** y el programa termina con un **código de salida** distinto de 0, para que quien lo use (una persona u otro programa) sepa que algo falló:

```py
import sys

def salir_con_error(mensaje):
    print(f"Error: {mensaje}", file=sys.stderr)
    sys.exit(1)
```

Divide el programa en funciones pequeñas: una para cargar, otra para guardar, una por orden y una función `main` que mira la orden y llama a la que toca.

### Para ir más allá

Cuando lo tengas, prueba a añadir una fecha límite a las tareas, ordenarlas por fecha, buscar por texto (`buscar pan`) o una orden `limpiar` que borre las hechas. Y en tu ordenador, mira el módulo `argparse`: hace gran parte del trabajo de leer órdenes y argumentos, y genera la ayuda solo.

## Objetivo

Escribe `tareas.py` con todas las órdenes del detalle. Las comprobaciones ejecutan tu programa muchas veces seguidas con distintos argumentos, compartiendo el disco, como harías tú en una terminal. Estos son los mensajes que esperan:

- `agregar`: `Tarea agregada (id: 1)`.
- `actualizar`: `Tarea 1 actualizada`. `eliminar`: `Tarea 2 eliminada`.
- `en-curso` y `hecha`: `Tarea 1: en curso` y `Tarea 3: hecha`.
- `listar`: una línea por tarea, como `[ ] 2 · Llamar a la abuela`, con `[ ]` para las pendientes, `[~]` para las que están en curso y `[x]` para las hechas, en el orden en que se crearon. Si no hay ninguna (o ninguna de ese estado): `No hay tareas.`
- Sin órdenes: la ayuda, que empieza por `Uso:`.

Y los errores, que pueden ir a la salida normal o a la de errores: `No existe la tarea 2`, `El id debe ser un número: abc`, `Orden desconocida: volar`, `Falta la descripción de la tarea` y `Filtro desconocido: todas`. Al final se revisa `tareas.json`.

## Pista

Empieza por `cargar`, `guardar` y `agregar`, y pruébalos desde la línea de argumentos antes de seguir: `agregar "Comprar pan"`, luego `listar`. Mira lo que guardó el programa en la consola (`# archivo guardado: tareas.json`).

Para encontrar una tarea por su id, recorre la lista y compara `tarea["id"] == id_tarea`; recuerda que el id llega como texto, así que conviértelo con `int()` dentro de un `try` por si no es un número. Para el nuevo id, `max()` de los ids que haya, más 1.

`listar pendientes` filtra por el estado `"pendiente"`: un diccionario como `{"pendientes": "pendiente", "en-curso": "en-curso", "hechas": "hecha"}` traduce el filtro al estado. Y otro como `{"pendiente": "[ ]", "en-curso": "[~]", "hecha": "[x]"}` da la marca de cada estado.

## Solución

La solución de referencia tiene una función por orden y una función `main` que elige cuál llamar según `sys.argv[1]`. Cada función de orden recibe la lista de tareas y el resto de argumentos, hace su cambio y guarda.

Los errores pasan todos por `salir_con_error`, que escribe el mensaje en la salida de errores y termina con `sys.exit(1)`. Así, funciones como `buscar` o `leer_id` pueden «rendirse» en cuanto algo va mal, sin que quien las llama tenga que comprobar nada: si `buscar` devuelve algo, es que la tarea existe.

Fíjate en que el archivo se lee una vez al principio y se escribe entero cada vez que algo cambia. Con unas pocas tareas es lo más sencillo; con miles, convendría una base de datos (lo verás en la ruta de SQL).
