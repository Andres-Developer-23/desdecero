from functools import wraps

from flask import Flask, request

app = Flask(__name__)
app.json.ensure_ascii = False

USUARIOS = {"ana": "python123", "luis": "clave456"}
TOKENS = {"tk-ana-5f2b9c": "ana", "tk-luis-8d41e7": "luis"}
ENTRADAS = [
    {"id": 1, "usuario": "ana", "texto": "Hoy empecé la ruta de Flask."},
    {"id": 2, "usuario": "luis", "texto": "Mi primera API ya responde JSON."},
    {"id": 3, "usuario": "ana", "texto": "Ya sé validar datos."},
]


@app.post("/login")
def login():
    return {"token": None}


def requiere_token(vista):
    """Llama a la vista con el usuario del token, o responde 401."""
    return vista


@app.get("/entradas")
def listar():
    return ENTRADAS


if __name__ == "__main__":
    app.run(debug=True)
