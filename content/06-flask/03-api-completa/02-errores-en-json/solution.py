from flask import Flask, abort
from werkzeug.exceptions import HTTPException

app = Flask(__name__)
app.json.ensure_ascii = False

LIBROS = [
    {"id": 1, "titulo": "El faro de la niebla"},
    {"id": 2, "titulo": "Python para curiosos"},
]


@app.get("/libros/<int:id>")
def ver_libro(id):
    for libro in LIBROS:
        if libro["id"] == id:
            return libro
    abort(404, description=f"No existe el libro {id}")


@app.get("/recomendado")
def recomendado():
    # Error a propósito: no hay un libro en la posición 5.
    return LIBROS[5]


@app.errorhandler(HTTPException)
def error_http(error):
    return {"codigo": error.code, "error": error.name, "mensaje": error.description}, error.code


@app.errorhandler(500)
def error_interno(error):
    return {"codigo": 500, "error": "Error interno del servidor"}, 500


if __name__ == "__main__":
    # Sin debug=True: en modo debug, Flask no usa el manejador de 500.
    app.run()
