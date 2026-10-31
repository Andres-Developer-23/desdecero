from flask import Flask, request

app = Flask(__name__)

PELICULAS = [
    {"titulo": "El viaje de Chihiro", "genero": "animacion", "anio": 2001},
    {"titulo": "Coco", "genero": "animacion", "anio": 2017},
    {"titulo": "Roma", "genero": "drama", "anio": 2018},
    {"titulo": "Relatos salvajes", "genero": "comedia", "anio": 2014},
    {"titulo": "El laberinto del fauno", "genero": "fantasia", "anio": 2006},
    {"titulo": "Encanto", "genero": "animacion", "anio": 2021},
]


@app.route("/peliculas")
def peliculas():
    resultado = PELICULAS

    genero = request.args.get("genero")
    if genero:
        resultado = [p for p in resultado if p["genero"] == genero.lower()]

    desde = request.args.get("desde", type=int)
    if desde is not None:
        resultado = [p for p in resultado if p["anio"] >= desde]

    orden = request.args.get("orden")
    if orden is not None:
        if orden not in ("anio", "titulo"):
            return {"error": "orden debe ser anio o titulo"}, 400
        resultado = sorted(resultado, key=lambda p: p[orden])

    limite = request.args.get("limite", 10, type=int)
    return {"total": len(resultado), "peliculas": [p["titulo"] for p in resultado[:limite]]}


if __name__ == "__main__":
    app.run(debug=True)
