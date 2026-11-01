import sqlite3

conexion = sqlite3.connect("libreria.db")
consulta = """
    SELECT categoria, COUNT(*), SUM(stock), ROUND(AVG(precio))
    FROM libros
    GROUP BY categoria
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, categoria
"""
for categoria, libros, unidades, precio_medio in conexion.execute(consulta):
    print(f"{categoria}: {libros} libros, {unidades} unidades, precio medio ${int(precio_medio)}")
conexion.close()
