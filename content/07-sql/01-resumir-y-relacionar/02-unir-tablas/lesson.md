---
title: Unir tablas con JOIN
minutes: 18
summary: Por qué los datos se reparten en varias tablas y cómo se juntan con JOIN y LEFT JOIN.
db: libreria.db
---

La tabla `libros` no guarda el nombre del autor, sino su `autor_id`: un número que apunta a una fila de la tabla `autores`. Así, cada autor se escribe **una sola vez**: si cambia de nombre, se cambia una fila, y no hay un mismo nombre escrito de tres formas distintas. Repartir los datos en tablas sin repeticiones se llama **normalizar**, y es la base de las bases de datos relacionales. La «relación» es justo esa: `libros.autor_id` apunta a `autores.id`.

A cambio, para enseñar un libro con su autor hay que **juntar** las dos tablas.

### JOIN … ON

`JOIN` combina cada fila de una tabla con las filas de otra que cumplen la condición de `ON`:

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
consulta = """
    SELECT l.titulo, a.nombre, a.pais
    FROM libros AS l
    JOIN autores AS a ON a.id = l.autor_id
    WHERE a.pais = 'Argentina'
    ORDER BY l.titulo
"""
for titulo, autor, pais in conexion.execute(consulta):
    print(f"{titulo} — {autor} ({pais})")
conexion.close()
```

- `libros AS l` le da a la tabla un **alias** corto (el `AS` es opcional: `libros l`).
- `a.id = l.autor_id` une cada libro con su autor.
- Cuando dos tablas tienen una columna con el mismo nombre (las dos tienen `id`), hay que decir de cuál es: `l.id` o `a.id`. Si no, SQLite responde `ambiguous column name: id`.

Puedes encadenar varios `JOIN`. Cada venta apunta a un cliente y a un libro:

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
consulta = """
    SELECT v.fecha, c.nombre, l.titulo, v.cantidad
    FROM ventas AS v
    JOIN clientes AS c ON c.id = v.cliente_id
    JOIN libros AS l ON l.id = v.libro_id
    ORDER BY v.fecha DESC
    LIMIT 3
"""
for fila in conexion.execute(consulta):
    print(fila)
conexion.close()
```

Y con todo lo anterior, `JOIN` se combina con `WHERE`, `GROUP BY` y los agregados: por ejemplo, para sumar las unidades vendidas de cada autor.

### LEFT JOIN: también las filas sin pareja

`JOIN` (o `INNER JOIN`) solo devuelve las filas que encuentran pareja: un cliente que no ha comprado nada no aparece al unir `clientes` con `ventas`. `LEFT JOIN` conserva **todas** las filas de la tabla de la izquierda y, si no tienen pareja, rellena las columnas de la otra con `NULL`:

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
consulta = """
    SELECT c.nombre, COUNT(v.id) AS compras
    FROM clientes AS c
    LEFT JOIN ventas AS v ON v.cliente_id = c.id
    GROUP BY c.id
    ORDER BY compras DESC, c.nombre
"""
for nombre, compras in conexion.execute(consulta):
    print(nombre, compras)
conexion.close()
```

`COUNT(v.id)` cuenta las ventas de verdad: para los clientes sin compras, `v.id` es `NULL` y cuenta 0 (`COUNT(*)` contaría 1). Y para quedarte con las filas **sin** pareja, filtra por ese `NULL`: `WHERE v.id IS NULL`. Si necesitas un número en lugar de `NULL`, `COALESCE(SUM(v.cantidad), 0)` devuelve el primer valor que no sea `NULL`.

## Ejercicio

Escribe dos informes de ventas:

1. Los **5 libros más vendidos** (sumando las unidades de sus ventas) con su autor. Si dos libros han vendido lo mismo, ordénalos por título.
2. Después de la línea `Sin ventas:`, los títulos de los libros que **nunca** se han vendido, en orden alfabético.

```txt
1. El robot que aprendió a dormir (Sofía Cárdenas): 16 unidades
2. Python para curiosos (Andrés Quintero): 11 unidades
...
Sin ventas:
- Canciones del río Magdalena
...
```

## Pista

Para el primero, une `ventas` con `libros` y `libros` con `autores`, agrupa por libro (`GROUP BY l.id`), suma `v.cantidad` y termina con `ORDER BY unidades DESC, l.titulo LIMIT 5`. Para numerar las líneas, `enumerate(..., 1)`. Para el segundo, `libros LEFT JOIN ventas` y `WHERE v.id IS NULL`.
