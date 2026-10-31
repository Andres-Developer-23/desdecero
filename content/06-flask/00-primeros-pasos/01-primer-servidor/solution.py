from flask import Flask

app = Flask(__name__)

LIBROS = ["El faro de la niebla", "Python para curiosos", "La última estación"]


@app.route("/")
def inicio():
    return "Bienvenido a la API de la biblioteca"


@app.route("/estado")
def estado():
    return {"estado": "ok", "libros": len(LIBROS)}


@app.route("/libros")
def libros():
    return LIBROS


if __name__ == "__main__":
    app.run(debug=True)
