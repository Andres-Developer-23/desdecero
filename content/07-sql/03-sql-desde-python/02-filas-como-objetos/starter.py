import sqlite3


def libros_de(conexion, categoria):
    consulta = "SELECT id, titulo, autor_id, precio FROM libros WHERE categoria = ?"
    return conexion.execute(consulta, (categoria,)).fetchall()


def libro(conexion, id):
    return conexion.execute("SELECT id, titulo, autor_id, precio FROM libros WHERE id = ?", (id,)).fetchone()


conexion = sqlite3.connect("libreria.db")
for datos in libros_de(conexion, "Ciencia ficción"):
    print(datos)
print(libro(conexion, 2))
print(libro(conexion, 99))
conexion.close()
