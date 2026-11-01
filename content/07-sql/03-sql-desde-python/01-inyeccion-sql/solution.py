import sqlite3


def buscar_libros(conexion, texto, categoria=None):
    sql = "SELECT titulo FROM libros WHERE titulo LIKE ?"
    valores = [f"%{texto}%"]
    if categoria is not None:
        sql += " AND categoria = ?"
        valores.append(categoria)
    sql += " ORDER BY titulo"
    return [titulo for (titulo,) in conexion.execute(sql, valores)]


conexion = sqlite3.connect("libreria.db")
print(buscar_libros(conexion, "python"))
print(buscar_libros(conexion, "DE", "Novela"))
conexion.close()
