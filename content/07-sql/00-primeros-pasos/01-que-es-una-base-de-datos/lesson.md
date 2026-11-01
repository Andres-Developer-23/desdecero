---
title: Qué es una base de datos
minutes: 14
summary: Tablas, filas y columnas, el lenguaje SQL y tu primera consulta desde Python con sqlite3.
db: libreria.db
---

Hasta ahora, los datos de tus programas vivían en listas y diccionarios (que desaparecen al terminar) o en archivos JSON y CSV, que hay que leer enteros para buscar algo y escribir enteros para cambiar una línea. Cuando los datos crecen, o varios programas los usan a la vez, hace falta una **base de datos**: un sistema que los guarda de forma ordenada y te devuelve justo lo que pides, aunque haya millones de registros.

### Tablas, filas y columnas

Las bases de datos más usadas son **relacionales**: guardan los datos en **tablas**, parecidas a una hoja de cálculo.

- Cada **columna** tiene un nombre y un tipo de dato: `titulo` es texto y `precio`, un número entero.
- Cada **fila** es un registro: un libro, un cliente, una venta.
- Una columna, normalmente `id`, es la **clave primaria**: un valor distinto en cada fila que la identifica sin confusión.

Así empieza la tabla `libros` de la librería que vas a usar en esta ruta:

```txt
id | titulo                     | autor_id | precio
---+----------------------------+----------+-------
 1 | El faro de la niebla       |        1 |  45900
 2 | Python para curiosos       |        2 |  68500
 3 | Cartas desde el páramo     |        3 |  39900
 4 | La aritmética de las nubes |        4 |  52000
```

(Tiene más columnas: `categoria`, `paginas`, `publicado` y `stock`.)

### SQL y SQLite

Con la base de datos se habla en **SQL** (*Structured Query Language*), un lenguaje en el que dices **qué** datos quieres, no cómo buscarlos. La consulta más sencilla pide unas columnas de una tabla:

```txt
SELECT titulo, precio FROM libros
```

Hay muchos sistemas de bases de datos (PostgreSQL, MySQL, SQL Server…), y todos entienden SQL con pequeñas diferencias. **SQLite** es el más sencillo: la base de datos entera es **un solo archivo**, sin servidor que instalar, y Python lo trae de serie con el módulo `sqlite3`. Está en todos los móviles y navegadores: es la base de datos más usada del mundo. Aquí funciona SQLite de verdad, el mismo motor que usa Python en tu ordenador.

### Tu primera consulta desde Python

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
cursor = conexion.execute("SELECT titulo, precio FROM libros")
filas = cursor.fetchall()
print(len(filas), "libros")
print(filas[0])
for titulo, precio in filas[:3]:
    print(f"{titulo}: ${precio}")
conexion.close()
```

- `sqlite3.connect("libreria.db")` abre una **conexión** con la base de datos (si el archivo no existe, lo crea vacío).
- `conexion.execute(sql)` ejecuta una sentencia SQL y devuelve un **cursor**, que recorre el resultado.
- `cursor.fetchall()` devuelve todas las filas en una lista; cada fila es una **tupla** con las columnas que pediste, en el mismo orden. Por eso se puede desempaquetar en el `for`.
- `conexion.close()` cierra la conexión cuando terminas.

`SELECT *` pide todas las columnas. Y no hace falta guardar el cursor: se puede recorrer directamente, y `fetchone()` devuelve solo la siguiente fila (o `None` si no quedan):

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
for fila in conexion.execute("SELECT * FROM autores"):
    print(fila)

cursor = conexion.execute("SELECT nombre, ciudad FROM clientes")
print(cursor.fetchone())
print(cursor.fetchone())
conexion.close()
```

Las palabras de SQL (`SELECT`, `FROM`) se escriben en mayúsculas por costumbre, para distinguirlas de los nombres de tus tablas y columnas, pero SQL no distingue mayúsculas y minúsculas en ellas.

### La base de datos de práctica

`libreria.db` es la base de datos de una librería con cuatro tablas: `autores`, `libros`, `clientes` y `ventas`. Ábrela en la pestaña **datos**: verás sus tablas, la estructura de cada una (pulsa «estructura de la tabla») y sus filas. Abajo hay una consola para escribir SQL directamente; prueba `SELECT nombre, pais FROM autores` y pulsa «ejecutar SQL» (o Ctrl + Enter).

Cada vez que ejecutas un programa, `libreria.db` vuelve a su estado inicial, así que puedes experimentar sin miedo a estropearla.

## Ejercicio

Conecta con `libreria.db` y muestra todos los autores, uno por línea, con su país entre paréntesis, en el orden en que salen de la tabla. Al final, escribe cuántos son:

```txt
Marta Ibáñez (Colombia)
Andrés Quintero (Colombia)
...
Natalia Rojas (Colombia)
11 autores
```

## Pista

`SELECT nombre, pais FROM autores` devuelve tuplas de dos elementos: recórrelas con `for nombre, pais in ...`. Si guardas el resultado de `fetchall()` en una variable, `len()` te dice cuántas filas hay.
