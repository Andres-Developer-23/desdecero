import sqlite3

conexion = sqlite3.connect("cine.db")
conexion.execute("""
    CREATE TABLE IF NOT EXISTS peliculas (
        id INTEGER PRIMARY KEY,
        titulo TEXT NOT NULL UNIQUE,
        anio INTEGER NOT NULL CHECK (anio >= 1888),
        duracion INTEGER,
        nota REAL NOT NULL DEFAULT 0 CHECK (nota BETWEEN 0 AND 10)
    )
""")
for columna in conexion.execute("PRAGMA table_info(peliculas)"):
    print(columna[1], columna[2])
conexion.close()
