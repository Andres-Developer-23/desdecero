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
    return {"error": "Sin hacer"}, 501


@app.post("/ventas")
def crear_venta():
    return {"error": "Sin hacer"}, 501


@app.get("/ventas/<int:id>")
def ver_venta(id):
    return {"error": "Sin hacer"}, 501


if __name__ == "__main__":
    app.run(debug=True)
