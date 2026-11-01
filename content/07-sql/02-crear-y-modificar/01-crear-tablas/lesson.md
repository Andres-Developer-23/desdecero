---
title: Crear tablas
minutes: 16
summary: CREATE TABLE con tipos, clave primaria y restricciones (NOT NULL, UNIQUE, DEFAULT y CHECK) que protegen los datos.
---

Hasta aquí has consultado una base de datos que ya existía. Ahora vas a crear las tuyas. Una tabla se crea con `CREATE TABLE`, su nombre y la lista de columnas, cada una con su **tipo** y sus **restricciones**:

```py
import sqlite3

conexion = sqlite3.connect("tienda.db")
conexion.execute("""
    CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL UNIQUE,
        precio INTEGER NOT NULL CHECK (precio > 0),
        stock INTEGER NOT NULL DEFAULT 0,
        activo INTEGER NOT NULL DEFAULT 1
    )
""")
for columna in conexion.execute("PRAGMA table_info(productos)"):
    print(columna)
print(conexion.execute("SELECT name FROM sqlite_master WHERE type = 'table'").fetchall())
conexion.close()
```

Al ejecutarlo, `tienda.db` aparece en la pestaña **datos**, con su tabla vacía. `PRAGMA table_info(productos)` describe las columnas (posición, nombre, tipo, si es obligatoria, valor por defecto y si es clave primaria), y la tabla especial `sqlite_master` guarda la lista de tablas de la base de datos.

### Tipos de datos

SQLite tiene cinco tipos: `INTEGER` (enteros), `REAL` (números con decimales), `TEXT`, `BLOB` (bytes, como una imagen) y `NULL`. No tiene tipos propios para todo:

- los valores **sí/no** se guardan como `INTEGER` 0 o 1;
- las **fechas**, como texto `'AAAA-MM-DD'`, que se ordena bien y se compara bien;
- el **dinero**, mejor como `INTEGER` (en pesos o en céntimos) que como `REAL`, para no arrastrar errores de redondeo.

SQLite es flexible con los tipos: el de una columna es una preferencia, y si guardas el texto `'12'` en una columna `INTEGER`, lo convierte en el número 12. Otras bases de datos son más estrictas, así que conviene guardar cada valor en su tipo.

### Clave primaria y restricciones

- `id INTEGER PRIMARY KEY`: si al insertar no das un `id`, SQLite pone uno nuevo, el mayor que haya más uno.
- `NOT NULL`: la columna es obligatoria.
- `UNIQUE`: no puede haber dos filas con el mismo valor.
- `DEFAULT 0`: el valor que se usa si no das ninguno.
- `CHECK (precio > 0)`: una condición que tiene que cumplir cada fila.

Las restricciones son la última línea de defensa de tus datos: aunque un programa tenga un fallo, la base de datos no deja guardar un producto sin nombre o con precio negativo, y responde con un `sqlite3.IntegrityError`:

```py
import sqlite3

conexion = sqlite3.connect(":memory:")
conexion.execute("""
    CREATE TABLE productos (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL UNIQUE,
        precio INTEGER CHECK (precio > 0)
    )
""")
conexion.execute("INSERT INTO productos (nombre, precio) VALUES ('Café', 9500)")
pruebas = [
    "INSERT INTO productos (nombre, precio) VALUES ('Café', 8000)",
    "INSERT INTO productos (precio) VALUES (8000)",
    "INSERT INTO productos (nombre, precio) VALUES ('Té', -5)",
]
for sql in pruebas:
    try:
        conexion.execute(sql)
    except sqlite3.IntegrityError as error:
        print("IntegrityError:", error)
print(conexion.execute("SELECT * FROM productos").fetchall())
```

`":memory:"` es una base de datos que vive solo en la memoria, sin archivo: perfecta para pruebas. (Los `INSERT` los verás a fondo en la siguiente lección.)

### IF NOT EXISTS y DROP TABLE

Un programa que crea sus tablas suele ejecutarse muchas veces. `CREATE TABLE productos` daría error la segunda vez (`table productos already exists`); con `CREATE TABLE IF NOT EXISTS` solo la crea si no existe. Para borrar una tabla con todos sus datos está `DROP TABLE IF EXISTS productos`: úsalo con cuidado.

En tu ordenador, `tienda.db` es un archivo que queda guardado. En el simulador dura hasta que vuelves a ejecutar el programa: cada ejecución empieza sin archivos, como un disco nuevo.

## Ejercicio

Crea en `cine.db` la tabla `peliculas`, de forma que el programa se pueda ejecutar más de una vez sin error, con estas columnas:

- `id`: entero, clave primaria;
- `titulo`: texto obligatorio que no se puede repetir;
- `anio`: entero obligatorio, que tiene que ser 1888 o posterior (el año de la primera película);
- `duracion`: entero (los minutos), opcional;
- `nota`: número con decimales, entre 0 y 10, que vale 0 si no se da.

Después, muestra el nombre y el tipo de cada columna con `PRAGMA table_info`:

```txt
id INTEGER
titulo TEXT
anio INTEGER
duracion INTEGER
nota REAL
```

Las comprobaciones intentarán guardar películas que incumplen las reglas, y tu tabla tiene que impedirlo.

## Pista

`nota REAL NOT NULL DEFAULT 0 CHECK (nota BETWEEN 0 AND 10)` junta varias restricciones en una columna. Cada fila de `PRAGMA table_info` es una tupla: el nombre está en la posición 1 y el tipo en la 2.
