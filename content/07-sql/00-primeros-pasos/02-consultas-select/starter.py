import sqlite3

conexion = sqlite3.connect("libreria.db")
consulta = """
    SELECT titulo, precio
    FROM libros
"""
for titulo, precio in conexion.execute(consulta):
    print(f"{titulo} · ${precio}")
conexion.close()
