---
title: Insertar datos
minutes: 16
summary: INSERT INTO con parámetros ?, executemany para muchas filas, lastrowid y por qué hay que confirmar con commit().
---

Las filas se añaden con `INSERT INTO`, el nombre de la tabla, las columnas que vas a dar y sus valores:

```txt
INSERT INTO productos (nombre, precio) VALUES ('Café', 9500)
```

Las columnas que no nombras toman su valor por defecto (`DEFAULT`), o `NULL`, y el `id` se pone solo. Con un solo `INSERT` también se pueden añadir varias filas: `VALUES ('Té', 4200), ('Cacao', 12000)`.

### Los valores van como parámetros

Casi siempre, los valores vienen de variables de tu programa. **No** los pegues en el texto del SQL con un f-string: escribe un `?` en cada sitio y pasa los valores aparte, en una tupla. La base de datos los recibe por separado y los guarda tal cual, con apóstrofos o lo que lleven (en la lección de inyección de SQL verás por qué es tan importante).

```py
import sqlite3

conexion = sqlite3.connect("tienda.db")
conexion.execute("""
    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        precio INTEGER NOT NULL
    )
""")

cursor = conexion.execute("INSERT INTO productos (nombre, precio) VALUES (?, ?)", ("Café", 9500))
print("id del café:", cursor.lastrowid)

nuevos = [("Té verde", 4200), ("Cacao", 12000), ("Panela de Santander", 3500)]
cursor = conexion.executemany("INSERT INTO productos (nombre, precio) VALUES (?, ?)", nuevos)
print("filas insertadas:", cursor.rowcount)
print("¿transacción abierta?", conexion.in_transaction)

conexion.commit()
print("¿transacción abierta?", conexion.in_transaction)
print(conexion.execute("SELECT * FROM productos").fetchall())
conexion.close()
```

- `cursor.lastrowid` es el `id` de la fila que acabas de insertar: lo necesitas para devolverlo o para usarlo en otra tabla.
- `executemany(sql, lista)` ejecuta el mismo `INSERT` con cada tupla de la lista.
- `cursor.rowcount` dice cuántas filas cambió la sentencia.
- Si solo hay un valor, la tupla lleva coma: `(nombre,)`. Sin ella, `(nombre)` es un texto entre paréntesis, y Python lo trataría como una secuencia de letras.

### commit(): confirmar los cambios

Antes de un `INSERT`, `UPDATE` o `DELETE`, Python abre una **transacción**: los cambios quedan pendientes (`conexion.in_transaction` vale `True`) hasta que los confirmas con `conexion.commit()`. Si cierras la conexión sin confirmar, **se pierden**:

```py
import sqlite3

conexion = sqlite3.connect("notas.db")
conexion.execute("CREATE TABLE notas (texto TEXT)")
conexion.execute("INSERT INTO notas VALUES ('esta nota no se confirmó')")
conexion.close()

conexion = sqlite3.connect("notas.db")
print(conexion.execute("SELECT COUNT(*) FROM notas").fetchone()[0])
conexion.close()
```

La tabla existe (el `CREATE TABLE` no necesita `commit()`), pero la nota se perdió. Olvidar el `commit()` es el error más habitual al empezar: el programa parece funcionar, porque la misma conexión sí ve sus cambios pendientes, pero no queda nada guardado.

Otra forma de confirmar es un bloque `with conexion:`: al terminar el bloque hace `commit()` (o deshace los cambios si hubo un error). Lo verás en la siguiente lección.

## Ejercicio

Guarda la agenda de contactos en `agenda.db`:

1. Crea la tabla `contactos` con `id` (clave primaria), `nombre` (obligatorio), `telefono` (obligatorio y sin repetir) y `ciudad`.
2. Inserta todos los contactos de la lista `contactos` con `executemany`.
3. Inserta `nuevo` con `execute` y escribe su id con `lastrowid`.
4. Confirma los cambios y escribe cuántos contactos hay guardados, con una consulta.

```txt
Laura Gil tiene el id 5
5 contactos guardados
```

Las comprobaciones cierran la conexión y abren otra: sin `commit()`, no encontrarán nada.

## Pista

`executemany("INSERT INTO contactos (nombre, telefono, ciudad) VALUES (?, ?, ?)", contactos)` inserta la lista entera. Para contar, `SELECT COUNT(*) FROM contactos` y `fetchone()[0]`. No olvides `conexion.commit()` antes de terminar.
