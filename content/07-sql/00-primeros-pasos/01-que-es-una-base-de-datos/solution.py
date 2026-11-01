import sqlite3

conexion = sqlite3.connect("libreria.db")
autores = conexion.execute("SELECT nombre, pais FROM autores").fetchall()
for nombre, pais in autores:
    print(f"{nombre} ({pais})")
print(len(autores), "autores")
conexion.close()
