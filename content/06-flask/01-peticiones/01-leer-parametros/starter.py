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
    # Lee y aplica genero, desde, orden y limite
    return {"total": len(resultado), "peliculas": [p["titulo"] for p in resultado]}


if __name__ == "__main__":
    app.run(debug=True)
