from flask import Flask

app = Flask(__name__)

LIBROS = ["El faro de la niebla", "Python para curiosos", "La última estación"]


@app.route("/")
def inicio():
    return "Hola"


# Añade aquí las rutas /estado y /libros


if __name__ == "__main__":
    app.run(debug=True)
