import sqlite3

conexion = sqlite3.connect("libreria.db")

mas_vendidos = """
    SELECT l.titulo, v.cantidad
    FROM ventas AS v
    JOIN libros AS l ON l.id = v.libro_id
"""
for posicion, (titulo, unidades) in enumerate(conexion.execute(mas_vendidos), 1):
    print(f"{posicion}. {titulo}: {unidades} unidades")

print("Sin ventas:")
conexion.close()
