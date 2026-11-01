import sqlite3

conexion = sqlite3.connect("cine.db")
conexion.execute("""
    CREATE TABLE peliculas (
        id INTEGER PRIMARY KEY,
        titulo TEXT
    )
""")

conexion.close()
