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
            estudiante_id INTEGER,
            curso_id INTEGER
        );
    """)


def inscribir(conexion, estudiante_id, curso_id):
    pass


def cursos_de(conexion, estudiante_id):
    return []


conexion = sqlite3.connect("escuela.db")
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
