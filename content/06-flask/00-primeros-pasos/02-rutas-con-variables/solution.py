from flask import Flask, abort

app = Flask(__name__)

LIBROS = [
    {"id": 1, "titulo": "El faro de la niebla", "autor": "Marta Ibáñez", "categoria": "novela", "publicado": 2021},
    {"id": 2, "titulo": "Python para curiosos", "autor": "Andrés Quintero", "categoria": "programacion", "publicado": 2024},
    {"id": 3, "titulo": "Versos para un lunes", "autor": "Clara Montoya", "categoria": "poesia", "publicado": 2020},
    {"id": 4, "titulo": "La última estación", "autor": "Marta Ibáñez", "categoria": "novela", "publicado": 2024},
]


@app.route("/libros")
def listar():
    return [{"id": libro["id"], "titulo": libro["titulo"]} for libro in LIBROS]


@app.route("/libros/<int:id>")
def ver(id):
    for libro in LIBROS:
        if libro["id"] == id:
            return libro
    abort(404)


@app.route("/categorias/<categoria>/libros")
def por_categoria(categoria):
    return [libro["titulo"] for libro in LIBROS if libro["categoria"] == categoria]


if __name__ == "__main__":
    app.run(debug=True)
