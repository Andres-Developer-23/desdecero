from flask import Flask, abort, request, url_for

app = Flask(__name__)

NOTAS = [
    {"id": 1, "titulo": "Compras", "texto": "Pan, café y manzanas"},
    {"id": 2, "titulo": "Ideas", "texto": "Una API para mis recetas"},
]


@app.get("/notas")
def listar_notas():
    return NOTAS


# Añade GET /notas/<int:id> y POST /notas


if __name__ == "__main__":
    app.run(debug=True)
