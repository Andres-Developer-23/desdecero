---
title: Filas como objetos
minutes: 15
summary: sqlite3.Row para pedir cada columna por su nombre, convertir filas en diccionarios y en objetos de tus clases, y cursor.description.
db: libreria.db
---

Las filas como tuplas son prácticas para consultas cortas, pero `fila[3]` no dice qué es, y si un día añades una columna al `SELECT`, todos los índices se mueven. Es más claro pedir cada columna **por su nombre**.

### sqlite3.Row

Si a la conexión le pones `row_factory = sqlite3.Row`, cada fila es un objeto `Row`, que funciona por posición y también por nombre:

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
conexion.row_factory = sqlite3.Row

fila = conexion.execute("SELECT id, titulo, precio FROM libros WHERE id = 2").fetchone()
print(fila["titulo"], fila["precio"])
print(fila[0], fila["TITULO"])
print(fila.keys())
print(dict(fila))
print(conexion.execute("SELECT * FROM libros WHERE id = 99").fetchone())
conexion.close()
```

- `fila["titulo"]` pide la columna por su nombre (sin distinguir mayúsculas); `fila[0]`, por posición.
- `fila.keys()` da los nombres de las columnas, y `dict(fila)` la convierte en un diccionario: justo lo que necesita una API para responder JSON.
- El nombre de una columna calculada es el que le pongas con `AS`: `SELECT COUNT(*) AS total` se pide como `fila["total"]`.
- Como antes, `fetchone()` devuelve `None` si no hay fila: compruébalo antes de usarla.

`row_factory` también se puede poner en un cursor, y aceptar cualquier función que reciba el cursor y la tupla. `cursor.description` tiene una tupla por columna con su nombre en la posición 0:

```py
import sqlite3


def como_diccionario(cursor, fila):
    columnas = [columna[0] for columna in cursor.description]
    return dict(zip(columnas, fila))


conexion = sqlite3.connect("libreria.db")
conexion.row_factory = como_diccionario
for cliente in conexion.execute("SELECT nombre, ciudad FROM clientes WHERE ciudad = 'Cali'"):
    print(cliente)
conexion.close()
```

### De filas a objetos

Con los datos en un diccionario, crear objetos de tus propias clases es inmediato. Con una clase de datos, `**` reparte el diccionario en los argumentos:

```py
import sqlite3
from dataclasses import dataclass


@dataclass
class Autor:
    id: int
    nombre: str
    pais: str


conexion = sqlite3.connect("libreria.db")
conexion.row_factory = sqlite3.Row
consulta = "SELECT id, nombre, pais FROM autores WHERE pais = ?"
autores = [Autor(**dict(fila)) for fila in conexion.execute(consulta, ("México",))]
for autor in autores:
    print(autor)
conexion.close()
```

Para que encaje, los nombres de las columnas del `SELECT` tienen que coincidir con los atributos de la clase; si no, cámbialos con `AS`.

### Muchas filas

Un cursor se puede recorrer con `for` sin cargar todas las filas a la vez, y `fetchmany(n)` devuelve las siguientes `n` (una lista vacía cuando se acaban). Para resultados grandes es mejor que `fetchall()`, que lo carga todo en memoria.

## Ejercicio

Escribe dos funciones sobre `libreria.db`, usando `sqlite3.Row`:

- `libros_de(conexion, categoria)`: la lista de libros de esa categoría, del más barato al más caro. Cada libro es un diccionario con `id`, `titulo`, `autor` (el **nombre** del autor) y `precio`.
- `libro(conexion, id)`: el diccionario de ese libro, con las mismas claves, o `None` si no existe.

```txt
>>> libros_de(conexion, "Ciencia ficción")[0]
{'id': 16, 'titulo': 'Señales desde Europa', 'autor': 'Tomás Beltrán', 'precio': 49500}
>>> libro(conexion, 99)
None
```

## Pista

Las dos funciones comparten la consulta: `SELECT l.id, l.titulo, a.nombre AS autor, l.precio FROM libros AS l JOIN autores AS a ON a.id = l.autor_id`, con un `WHERE` distinto. Pon `conexion.row_factory = sqlite3.Row` y convierte cada fila con `dict(fila)`.
