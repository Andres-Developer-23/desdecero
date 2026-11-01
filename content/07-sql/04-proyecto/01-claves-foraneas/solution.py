import sqlite3


def crear_tablas(conexion):
    conexion.executescript("""
        CREATE TABLE IF NOT EXISTS estudiantes (
            id INTEGER PRIMARY KEY,
            nombre TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS cursos (
            id INTEGER PRIMARY KEY,
            nombre TEXT NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS inscripciones (
            estudiante_id INTEGER NOT NULL REFERENCES estudiantes (id) ON DELETE CASCADE,
            curso_id INTEGER NOT NULL REFERENCES cursos (id) ON DELETE CASCADE,
            PRIMARY KEY (estudiante_id, curso_id)
        );
    """)


def inscribir(conexion, estudiante_id, curso_id):
    with conexion:
        conexion.execute(
            "INSERT INTO inscripciones (estudiante_id, curso_id) VALUES (?, ?)",
            (estudiante_id, curso_id),
        )


def cursos_de(conexion, estudiante_id):
    consulta = """
        SELECT c.nombre
        FROM cursos AS c
        JOIN inscripciones AS i ON i.curso_id = c.id
        WHERE i.estudiante_id = ?
        ORDER BY c.nombre
    """
    return [nombre for (nombre,) in conexion.execute(consulta, (estudiante_id,))]


conexion = sqlite3.connect("escuela.db")
conexion.execute("PRAGMA foreign_keys = ON")
crear_tablas(conexion)
conexion.executemany("INSERT INTO estudiantes (nombre) VALUES (?)", [("Ana",), ("Luis",)])
conexion.executemany("INSERT INTO cursos (nombre) VALUES (?)", [("SQL",), ("Python",), ("Flask",)])
conexion.commit()

inscribir(conexion, 1, 1)
inscribir(conexion, 1, 2)
inscribir(conexion, 2, 1)
print("Ana:", cursos_de(conexion, 1))
print("Luis:", cursos_de(conexion, 2))
conexion.close()
