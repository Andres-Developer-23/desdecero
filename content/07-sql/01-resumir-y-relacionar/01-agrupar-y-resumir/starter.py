import sqlite3

conexion = sqlite3.connect("libreria.db")
consulta = """
    SELECT categoria, COUNT(*)
    FROM libros
    GROUP BY categoria
"""
for categoria, libros in conexion.execute(consulta):
    print(f"{categoria}: {libros} libros")
conexion.close()
