from functools import wraps

from flask import Flask, abort, request, url_for
from werkzeug.exceptions import HTTPException

app = Flask(__name__)
app.json.ensure_ascii = False

USUARIOS = {
    "ana": {"clave": "python123", "token": "tk-ana-5f2b9c"},
    "luis": {"clave": "clave456", "token": "tk-luis-8d41e7"},
}
TAREAS = [
    {"id": 1, "titulo": "Comprar pan", "hecha": False, "prioridad": "baja", "usuario": "ana"},
    {"id": 2, "titulo": "Terminar el curso de Python", "hecha": False, "prioridad": "alta", "usuario": "ana"},
    {"id": 3, "titulo": "Llamar a la abuela", "hecha": True, "prioridad": "media", "usuario": "ana"},
    {"id": 4, "titulo": "Pagar la factura de la luz", "hecha": False, "prioridad": "alta", "usuario": "luis"},
]
PRIORIDADES = ("baja", "media", "alta")


@app.errorhandler(HTTPException)
def error_http(error):
    return {"error": error.description}, error.code


def requiere_token(vista):
    """Llama a la vista con el usuario del token, o responde 401."""

    @wraps(vista)
    def envoltura(*args, **kwargs):
        auth = request.authorization
        if auth is None or auth.type != "bearer":
            return {"error": "Falta el token"}, 401, {"WWW-Authenticate": "Bearer"}
        for nombre, cuenta in USUARIOS.items():
            if cuenta["token"] == auth.token:
                return vista(nombre, *args, **kwargs)
        return {"error": "El token no es válido"}, 401, {"WWW-Authenticate": "Bearer"}

    return envoltura


def publica(tarea):
    """La tarea como la ve el cliente (sin el usuario)."""
    return {"id": tarea["id"], "titulo": tarea["titulo"], "hecha": tarea["hecha"], "prioridad": tarea["prioridad"]}


def buscar(usuario, id):
    """La tarea de ese usuario con ese id, o termina con 404."""
    for tarea in TAREAS:
        if tarea["id"] == id and tarea["usuario"] == usuario:
            return tarea
    abort(404, description=f"No tienes ninguna tarea con id {id}")


def datos_json():
    """El cuerpo de la petición como diccionario, o termina con 400."""
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        abort(400, description="Envía los datos como un objeto JSON")
    return datos


def validar(datos, parcial):
    """Devuelve un diccionario {campo: problema} (vacío si todo está bien)."""
    errores = {}
    return errores


@app.post("/v1/token")
def token():
    datos = datos_json()
    cuenta = USUARIOS.get(datos.get("usuario"))
    if cuenta is None or cuenta["clave"] != datos.get("clave"):
        return {"error": "Usuario o clave incorrectos"}, 401
    return {"token": cuenta["token"], "tipo": "Bearer"}


@app.get("/v1/tareas")
@requiere_token
def listar(usuario):
    tareas = [tarea for tarea in TAREAS if tarea["usuario"] == usuario]
    return [publica(tarea) for tarea in tareas]


@app.get("/v1/tareas/<int:id>")
@requiere_token
def ver(usuario, id):
    return publica(buscar(usuario, id))


# Añade POST /v1/tareas, PATCH y DELETE /v1/tareas/<int:id>


if __name__ == "__main__":
    app.run(debug=True)
