import sqlite3

CONSULTA = """
    SELECT l.id, l.titulo, a.nombre AS autor, l.precio
    FROM libros AS l
    JOIN autores AS a ON a.id = l.autor_id
"""


def libros_de(conexion, categoria):
    conexion.row_factory = sqlite3.Row
    filas = conexion.execute(CONSULTA + " WHERE l.categoria = ? ORDER BY l.precio", (categoria,))
    return [dict(fila) for fila in filas]


def libro(conexion, id):
    conexion.row_factory = sqlite3.Row
    fila = conexion.execute(CONSULTA + " WHERE l.id = ?", (id,)).fetchone()
    if fila is None:
        return None
    return dict(fila)


conexion = sqlite3.connect("libreria.db")
for datos in libros_de(conexion, "Ciencia ficción"):
    print(datos)
print(libro(conexion, 2))
print(libro(conexion, 99))
conexion.close()
