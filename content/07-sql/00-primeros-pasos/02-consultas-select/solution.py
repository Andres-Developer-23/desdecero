import sqlite3

conexion = sqlite3.connect("libreria.db")
consulta = """
    SELECT titulo, precio
    FROM libros
    WHERE categoria IN ('Novela', 'Poesía') AND stock > 0
    ORDER BY precio DESC
"""
for titulo, precio in conexion.execute(consulta):
    print(f"{titulo} · ${precio}")
conexion.close()
