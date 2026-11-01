---
title: Contar, sumar y agrupar
minutes: 16
summary: Funciones de agregado (COUNT, SUM, AVG, MIN, MAX), GROUP BY para resumir por grupos y HAVING para filtrarlos.
db: libreria.db
---

Muchas preguntas no piden filas sino **resúmenes**: cuántos libros hay, cuánto vale el stock, cuál es el precio medio de cada categoría. Para eso están las **funciones de agregado**, que convierten muchas filas en un solo valor.

### Funciones de agregado

- `COUNT(*)` cuenta filas; `COUNT(email)` cuenta solo las que tienen email (las que no son `NULL`).
- `SUM(stock)` suma, `AVG(precio)` calcula la media, `MIN` y `MAX` dan el menor y el mayor.
- `ROUND(valor)` redondea a entero y `ROUND(valor, 2)`, a dos decimales.

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
fila = conexion.execute("""
    SELECT COUNT(*), SUM(stock), MIN(precio), MAX(precio), ROUND(AVG(precio))
    FROM libros
""").fetchone()
print(fila)
print(conexion.execute("SELECT COUNT(*), COUNT(email) FROM clientes").fetchone())
print(conexion.execute("SELECT COUNT(*) FROM libros WHERE stock = 0").fetchone()[0])
conexion.close()
```

Una consulta con agregados sin más devuelve **una sola fila**, así que lo cómodo es `fetchone()`. Fíjate en que `AVG` y `ROUND` devuelven números con decimales (`float`), aunque el resultado sea redondo.

### GROUP BY: un resumen por grupo

`GROUP BY` reparte las filas en grupos con el mismo valor y calcula los agregados de cada grupo. El resultado tiene una fila por grupo:

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
consulta = """
    SELECT categoria, COUNT(*) AS libros, SUM(stock) AS unidades
    FROM libros
    GROUP BY categoria
    ORDER BY libros DESC, categoria
"""
for categoria, libros, unidades in conexion.execute(consulta):
    print(categoria, libros, unidades)
conexion.close()
```

En el `SELECT` de una consulta agrupada solo pueden ir las columnas por las que agrupas y funciones de agregado: `SELECT categoria, titulo ... GROUP BY categoria` no tiene sentido, porque cada categoría tiene varios títulos. (SQLite no da error y devuelve uno cualquiera; otras bases de datos sí lo dan.)

Se puede agrupar por una expresión. Las fechas de las ventas son textos como `'2026-09-14'`, así que sus siete primeros caracteres son el mes:

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
consulta = """
    SELECT substr(fecha, 1, 7) AS mes, COUNT(*) AS ventas, SUM(cantidad) AS unidades
    FROM ventas
    GROUP BY mes
"""
print(conexion.execute(consulta).fetchall())
conexion.close()
```

### HAVING: filtrar los grupos

`WHERE` filtra **filas** antes de agrupar; `HAVING` filtra **grupos** después, y por eso puede usar los agregados. Por ejemplo, los autores con más de un libro, contando solo los publicados desde 2019:

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
consulta = """
    SELECT autor_id, COUNT(*) AS libros
    FROM libros
    WHERE publicado >= 2019
    GROUP BY autor_id
    HAVING COUNT(*) > 1
"""
print(conexion.execute(consulta).fetchall())
conexion.close()
```

SQL va resolviendo la consulta en este orden: `FROM` (de dónde), `WHERE` (qué filas), `GROUP BY` (cómo agrupar), `HAVING` (qué grupos), `SELECT` (qué columnas), `ORDER BY` y `LIMIT`. Por eso un `COUNT(*)` no puede ir en el `WHERE`: cuando se aplica, todavía no hay grupos que contar.

## Ejercicio

Muestra un resumen de cada **categoría que tenga más de un libro**: cuántos libros tiene, cuántas unidades hay en stock y su precio medio, redondeado y sin decimales. Ordénalas de la que tiene más libros a la que menos y, si empatan, por orden alfabético:

```txt
Novela: 4 libros, 17 unidades, precio medio $43825
Ciencia ficción: 3 libros, 7 unidades, precio medio $52433
...
```

Haz los cálculos en la consulta, con `GROUP BY` y `HAVING`.

## Pista

Agrupa con `GROUP BY categoria`, filtra los grupos con `HAVING COUNT(*) > 1` y ordena con `ORDER BY COUNT(*) DESC, categoria`. `ROUND(AVG(precio))` devuelve un `float` como `43825.0`: conviértelo con `int()` al escribirlo.
