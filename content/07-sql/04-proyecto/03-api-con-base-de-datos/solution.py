import sqlite3
from datetime import date

from flask import Flask, g, request, url_for

app = Flask(__name__)
app.json.ensure_ascii = False


def obtener_db():
    if "db" not in g:
        g.db = sqlite3.connect("libreria.db")
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def cerrar_db(error):
    db = g.pop("db", None)
    if db is not None:
        db.close()


LIBROS = """
    SELECT l.id, l.titulo, a.nombre AS autor, l.categoria, l.precio, l.stock
    FROM libros AS l
    JOIN autores AS a ON a.id = l.autor_id
"""


@app.get("/libros")
def listar_libros():
    categoria = request.args.get("categoria")
    if categoria:
        filas = obtener_db().execute(LIBROS + " WHERE l.categoria = ? ORDER BY l.id", (categoria,))
    else:
        filas = obtener_db().execute(LIBROS + " ORDER BY l.id")
    return [dict(fila) for fila in filas]


@app.get("/libros/<int:id>")
def ver_libro(id):
    fila = obtener_db().execute(LIBROS + " WHERE l.id = ?", (id,)).fetchone()
    if fila is None:
        return {"error": f"No existe el libro {id}"}, 404
    return dict(fila)


def buscar_venta(id):
    fila = obtener_db().execute("""
        SELECT v.id, v.fecha, c.nombre AS cliente, l.titulo AS libro, v.cantidad,
               v.cantidad * l.precio AS total
        FROM ventas AS v
        JOIN clientes AS c ON c.id = v.cliente_id
        JOIN libros AS l ON l.id = v.libro_id
        WHERE v.id = ?
    """, (id,)).fetchone()
    return dict(fila) if fila else None


def entero_positivo(valor):
    return isinstance(valor, int) and valor > 0


@app.post("/ventas")
def crear_venta():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        datos = {}
    for campo in ("cliente_id", "libro_id", "cantidad"):
        if not entero_positivo(datos.get(campo)):
            return {"error": f"«{campo}» tiene que ser un número entero mayor que 0"}, 422

    db = obtener_db()
    if db.execute("SELECT id FROM clientes WHERE id = ?", (datos["cliente_id"],)).fetchone() is None:
        return {"error": f"No existe el cliente {datos['cliente_id']}"}, 404
    libro = db.execute("SELECT stock FROM libros WHERE id = ?", (datos["libro_id"],)).fetchone()
    if libro is None:
        return {"error": f"No existe el libro {datos['libro_id']}"}, 404
    if libro["stock"] < datos["cantidad"]:
        return {"error": "No hay stock suficiente"}, 409

    with db:
        db.execute("UPDATE libros SET stock = stock - ? WHERE id = ?", (datos["cantidad"], datos["libro_id"]))
        cursor = db.execute(
            "INSERT INTO ventas (cliente_id, libro_id, cantidad, fecha) VALUES (?, ?, ?, ?)",
            (datos["cliente_id"], datos["libro_id"], datos["cantidad"], date.today().isoformat()),
        )
    venta = buscar_venta(cursor.lastrowid)
    return venta, 201, {"Location": url_for("ver_venta", id=venta["id"])}


@app.get("/ventas/<int:id>")
def ver_venta(id):
    venta = buscar_venta(id)
    if venta is None:
        return {"error": f"No existe la venta {id}"}, 404
    return venta


if __name__ == "__main__":
    app.run(debug=True)
