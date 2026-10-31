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
    return LIBROS


# Añade /libros/<int:id> y /categorias/<categoria>/libros


if __name__ == "__main__":
    app.run(debug=True)
