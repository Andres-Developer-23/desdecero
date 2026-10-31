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
    datos = request.get_json(silent=True) or {}
    usuario = datos.get("usuario")
    if usuario not in USUARIOS or USUARIOS[usuario] != datos.get("clave"):
        return {"error": "Usuario o clave incorrectos"}, 401
    token = next(token for token, nombre in TOKENS.items() if nombre == usuario)
    return {"token": token}


def requiere_token(vista):
    """Llama a la vista con el usuario del token, o responde 401."""

    @wraps(vista)
    def envoltura(*args, **kwargs):
        auth = request.authorization
        if auth is None or auth.type != "bearer":
            return {"error": "Falta el token"}, 401, {"WWW-Authenticate": "Bearer"}
        if auth.token not in TOKENS:
            return {"error": "Token no válido"}, 401, {"WWW-Authenticate": "Bearer"}
        return vista(TOKENS[auth.token], *args, **kwargs)

    return envoltura


@app.get("/entradas")
@requiere_token
def listar(usuario):
    return [{"id": e["id"], "texto": e["texto"]} for e in ENTRADAS if e["usuario"] == usuario]


@app.post("/entradas")
@requiere_token
def escribir(usuario):
    datos = request.get_json(silent=True) or {}
    texto = datos.get("texto")
    if not isinstance(texto, str) or not texto.strip():
        return {"error": "El texto no puede estar vacío"}, 422
    entrada = {"id": max(e["id"] for e in ENTRADAS) + 1, "usuario": usuario, "texto": texto.strip()}
    ENTRADAS.append(entrada)
    return {"id": entrada["id"], "texto": entrada["texto"]}, 201


if __name__ == "__main__":
    app.run(debug=True)
