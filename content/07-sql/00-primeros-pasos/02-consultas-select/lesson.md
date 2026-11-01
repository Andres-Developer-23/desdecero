---
title: Consultas con SELECT
minutes: 16
summary: Filtra filas con WHERE, ordénalas con ORDER BY, limita el resultado con LIMIT y calcula columnas nuevas.
db: libreria.db
---

Rara vez quieres una tabla entera. SQL te deja pedir solo las filas que cumplen una condición, en el orden que quieras y las que quieras.

### Filtrar con WHERE

`WHERE` va después de `FROM` y se queda con las filas que cumplen la condición:

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
consulta = """
    SELECT titulo, precio
    FROM libros
    WHERE categoria = 'Programación' AND precio < 70000
    ORDER BY precio
"""
for titulo, precio in conexion.execute(consulta):
    print(titulo, precio)
conexion.close()
```

Cuando la consulta es larga, escríbela en un texto de varias líneas con `"""`: SQL ignora los saltos de línea y los espacios de más.

Para las condiciones tienes:

- comparaciones: `=` (un solo igual), `<>` o `!=` (distinto), `<`, `>`, `<=`, `>=`;
- `AND`, `OR` y `NOT`, con paréntesis cuando los mezclas: `WHERE (categoria = 'Novela' OR categoria = 'Poesía') AND stock > 0`;
- `BETWEEN 30000 AND 50000`: un rango, con los dos extremos incluidos;
- `IN ('Novela', 'Poesía')`: el valor está en la lista (más corto que encadenar `OR`);
- `LIKE 'la %'`: textos que siguen un patrón, donde `%` es cualquier texto (también vacío) y `_` un solo carácter. No distingue mayúsculas y minúsculas, salvo en las letras con tilde.

Los textos van entre **comillas simples** (`'Novela'`). Las comillas dobles son para nombres de columnas, así que no las uses para los valores.

### NULL: el valor que falta

`NULL` significa «sin valor» o «desconocido», como `None` en Python: por ejemplo, el email de un cliente que no lo dio. Como es desconocido, `email = NULL` no es cierto para ninguna fila; se pregunta con `IS NULL` o `IS NOT NULL`.

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
print(conexion.execute("SELECT nombre FROM clientes WHERE email IS NULL").fetchall())
print(conexion.execute("SELECT titulo FROM libros WHERE titulo LIKE 'la %'").fetchall())
print(conexion.execute("SELECT DISTINCT categoria FROM libros ORDER BY categoria").fetchall())
print(conexion.execute("SELECT titulo, paginas FROM libros ORDER BY paginas DESC LIMIT 3").fetchall())
conexion.close()
```

### Ordenar y limitar

- `ORDER BY precio` ordena de menor a mayor (`ASC`, lo normal); `ORDER BY precio DESC`, de mayor a menor. Puedes ordenar por varias columnas: `ORDER BY categoria, precio DESC` ordena por categoría y, dentro de cada una, por precio. Sin `ORDER BY`, el orden de las filas no está garantizado.
- `LIMIT 3` se queda con las tres primeras filas; `LIMIT 3 OFFSET 6` se salta seis y devuelve las tres siguientes (así se pagina).
- `SELECT DISTINCT categoria` quita las filas repetidas.

### Columnas calculadas

En el `SELECT` también puedes calcular, y ponerle nombre al resultado con `AS`:

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
consulta = """
    SELECT titulo, precio * stock AS valor_en_tienda
    FROM libros
    WHERE stock > 0
    ORDER BY valor_en_tienda DESC
    LIMIT 3
"""
for titulo, valor in conexion.execute(consulta):
    print(f"{titulo}: ${valor}")
conexion.close()
```

Las partes de una consulta van siempre en este orden: `SELECT … FROM … WHERE … ORDER BY … LIMIT`. Prueba variaciones en la consola de la pestaña **datos** antes de llevarlas a tu programa.

## Ejercicio

La librería quiere recomendar lecturas de **Novela** o **Poesía** que tenga en la tienda (con `stock` mayor que 0). Muéstralas del libro más caro al más barato, con este formato:

```txt
La ciudad de los relojes parados · $47500
El faro de la niebla · $45900
...
```

Haz el filtro y el orden en la consulta SQL, no en Python.

## Pista

Combina `categoria IN ('Novela', 'Poesía')` con `AND stock > 0` en el `WHERE`, y termina la consulta con `ORDER BY precio DESC`. Si prefieres usar `OR`, pon esa parte entre paréntesis.
