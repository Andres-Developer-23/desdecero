---
title: Relaciones y claves foráneas
minutes: 18
summary: Relaciones uno a muchos y muchos a muchos, FOREIGN KEY con REFERENCES, PRAGMA foreign_keys y ON DELETE CASCADE.
---

En `libros`, la columna `autor_id` apunta a `autores.id`: es una **clave foránea** (*foreign key*), una columna que guarda la clave primaria de otra tabla. Así se representa una relación **uno a muchos**: un autor tiene muchos libros, y cada libro tiene un autor. Al crear la tabla, se declara con `REFERENCES`:

```txt
autor_id INTEGER NOT NULL REFERENCES autores (id)
```

Declararla permite que la base de datos **compruebe** la relación: que no haya libros de autores que no existen, ni autores borrados que dejen libros huérfanos. Pero SQLite, por compatibilidad con programas antiguos, **no lo comprueba** si no se lo pides en cada conexión con `PRAGMA foreign_keys = ON`:

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
sql = "INSERT INTO libros (titulo, autor_id, categoria, precio) VALUES (?, ?, ?, ?)"
fantasma = ("Libro fantasma", 99, "Novela", 10000)

conexion.execute(sql, fantasma)
print("Sin comprobar: se guardó un libro de un autor que no existe")
conexion.rollback()

conexion.execute("PRAGMA foreign_keys = ON")
try:
    conexion.execute(sql, fantasma)
except sqlite3.IntegrityError as error:
    print("IntegrityError:", error)
try:
    conexion.execute("DELETE FROM autores WHERE id = 1")
except sqlite3.IntegrityError as error:
    print("IntegrityError:", error)
conexion.close()
```

Ejecuta el `PRAGMA` nada más conectar: dentro de una transacción abierta no tiene efecto.

### Qué pasa al borrar: ON DELETE

Por defecto, no se puede borrar una fila a la que otras apuntan (como el autor 1, que tiene libros). Al declarar la clave foránea puedes elegir otra cosa:

- `ON DELETE CASCADE`: al borrar la fila, se borran también las que apuntan a ella;
- `ON DELETE SET NULL`: las que apuntan a ella se quedan con `NULL`;
- `ON DELETE RESTRICT`: impide el borrado (como el comportamiento por defecto).

### Muchos a muchos: una tabla intermedia

Un libro puede tener varias etiquetas y una etiqueta, varios libros. Esa relación **muchos a muchos** no cabe en una columna: se necesita una **tabla intermedia** con una fila por pareja, y dos claves foráneas. Su clave primaria es la pareja entera, `PRIMARY KEY (libro_id, etiqueta_id)`, para que no se pueda repetir:

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
conexion.execute("PRAGMA foreign_keys = ON")
conexion.executescript("""
    CREATE TABLE etiquetas (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL UNIQUE
    );
    CREATE TABLE libro_etiquetas (
        libro_id INTEGER NOT NULL REFERENCES libros (id) ON DELETE CASCADE,
        etiqueta_id INTEGER NOT NULL REFERENCES etiquetas (id) ON DELETE CASCADE,
        PRIMARY KEY (libro_id, etiqueta_id)
    );
    INSERT INTO etiquetas (nombre) VALUES ('para regalar'), ('clásico moderno'), ('ideal para empezar');
    INSERT INTO libro_etiquetas VALUES (2, 3), (7, 1), (13, 1), (13, 3), (1, 2);
""")
consulta = """
    SELECT e.nombre, l.titulo
    FROM etiquetas AS e
    JOIN libro_etiquetas AS le ON le.etiqueta_id = e.id
    JOIN libros AS l ON l.id = le.libro_id
    ORDER BY e.nombre, l.titulo
"""
for etiqueta, titulo in conexion.execute(consulta):
    print(f"{etiqueta}: {titulo}")

conexion.execute("DELETE FROM etiquetas WHERE nombre = 'para regalar'")
print(conexion.execute("SELECT COUNT(*) FROM libro_etiquetas").fetchone()[0], "parejas")
conexion.close()
```

`executescript()` ejecuta varias sentencias separadas por `;` (antes, confirma lo que hubiera pendiente). Las consultas cruzan la relación con dos `JOIN`, pasando por la tabla intermedia. Y al borrar una etiqueta, `ON DELETE CASCADE` borra sus parejas: quedan 3 de las 5. Mira las tablas nuevas en la pestaña **datos**.

## Ejercicio

Organiza las inscripciones de una escuela en `escuela.db`. Un estudiante se puede inscribir en varios cursos, y un curso tiene varios estudiantes.

1. Completa la tabla `inscripciones` en `crear_tablas()`: `estudiante_id` y `curso_id`, claves foráneas obligatorias hacia `estudiantes` y `cursos` que se borren en cascada, y una clave primaria con las dos para que nadie se inscriba dos veces en el mismo curso.
2. Activa la comprobación de las claves foráneas nada más conectar.
3. `inscribir(conexion, estudiante_id, curso_id)` guarda la inscripción y la confirma.
4. `cursos_de(conexion, estudiante_id)` devuelve la lista de nombres de los cursos del estudiante, en orden alfabético.

```txt
Ana: ['Python', 'SQL']
Luis: ['SQL']
```

## Pista

La tabla intermedia lleva `estudiante_id INTEGER NOT NULL REFERENCES estudiantes (id) ON DELETE CASCADE`, lo mismo para `curso_id`, y al final `PRIMARY KEY (estudiante_id, curso_id)`. En `cursos_de`, une `cursos` con `inscripciones` (`ON i.curso_id = c.id`), filtra por `i.estudiante_id = ?` y ordena por `c.nombre`.
