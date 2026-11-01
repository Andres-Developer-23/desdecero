import sqlite3


def buscar_libros(conexion, texto, categoria=None):
    sql = f"SELECT titulo FROM libros WHERE titulo LIKE '%{texto}%'"
    if categoria is not None:
        sql += f" AND categoria = '{categoria}'"
    sql += " ORDER BY titulo"
    return [titulo for (titulo,) in conexion.execute(sql)]


conexion = sqlite3.connect("libreria.db")
print(buscar_libros(conexion, "python"))
print(buscar_libros(conexion, "DE", "Novela"))
conexion.close()
