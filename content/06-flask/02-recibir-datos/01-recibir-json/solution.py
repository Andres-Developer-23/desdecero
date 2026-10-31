from flask import Flask, abort, request, url_for

app = Flask(__name__)

NOTAS = [
    {"id": 1, "titulo": "Compras", "texto": "Pan, café y manzanas"},
    {"id": 2, "titulo": "Ideas", "texto": "Una API para mis recetas"},
]


@app.get("/notas")
def listar_notas():
    return NOTAS


@app.get("/notas/<int:id>")
def ver_nota(id):
    for nota in NOTAS:
        if nota["id"] == id:
            return nota
    abort(404)


@app.post("/notas")
def crear_nota():
    datos = request.get_json()
    nota = {
        "id": max(nota["id"] for nota in NOTAS) + 1,
        "titulo": datos["titulo"],
        "texto": datos["texto"],
    }
    NOTAS.append(nota)
    return nota, 201, {"Location": url_for("ver_nota", id=nota["id"])}


if __name__ == "__main__":
    app.run(debug=True)
