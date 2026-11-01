import sqlite3


def vender(conexion, cliente_id, libro_id, cantidad, fecha):
    with conexion:
        fila = conexion.execute("SELECT stock FROM libros WHERE id = ?", (libro_id,)).fetchone()
        if fila is None:
            raise ValueError("El libro no existe")
        if fila[0] < cantidad:
            raise ValueError("No hay stock suficiente")
        conexion.execute("UPDATE libros SET stock = stock - ? WHERE id = ?", (cantidad, libro_id))
        cursor = conexion.execute(
            "INSERT INTO ventas (cliente_id, libro_id, cantidad, fecha) VALUES (?, ?, ?, ?)",
            (cliente_id, libro_id, cantidad, fecha),
        )
        return cursor.lastrowid


conexion = sqlite3.connect("libreria.db")
venta = vender(conexion, 1, 2, 3, "2026-11-02")
print("venta", venta)
print(conexion.execute("SELECT stock FROM libros WHERE id = 2").fetchone())
conexion.close()
