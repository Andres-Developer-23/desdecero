import sqlite3

conexion = sqlite3.connect("libreria.db")

mas_vendidos = """
    SELECT l.titulo, a.nombre, SUM(v.cantidad) AS unidades
    FROM ventas AS v
    JOIN libros AS l ON l.id = v.libro_id
    JOIN autores AS a ON a.id = l.autor_id
    GROUP BY l.id
    ORDER BY unidades DESC, l.titulo
    LIMIT 5
"""
for posicion, (titulo, autor, unidades) in enumerate(conexion.execute(mas_vendidos), 1):
    print(f"{posicion}. {titulo} ({autor}): {unidades} unidades")

sin_ventas = """
    SELECT l.titulo
    FROM libros AS l
    LEFT JOIN ventas AS v ON v.libro_id = l.id
    WHERE v.id IS NULL
    ORDER BY l.titulo
"""
print("Sin ventas:")
for (titulo,) in conexion.execute(sin_ventas):
    print(f"- {titulo}")
conexion.close()
