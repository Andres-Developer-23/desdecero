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
    for campo in datos:
        if campo not in ("titulo", "hecha", "prioridad"):
            errores[campo] = "campo desconocido"
    if "titulo" in datos:
        titulo = datos["titulo"]
        if not isinstance(titulo, str) or not titulo.strip():
            errores["titulo"] = "no puede estar vacío"
        elif len(titulo.strip()) > 80:
            errores["titulo"] = "admite como máximo 80 caracteres"
    elif not parcial:
        errores["titulo"] = "es obligatorio"
    if "hecha" in datos and not isinstance(datos["hecha"], bool):
        errores["hecha"] = "debe ser true o false"
    if "prioridad" in datos and datos["prioridad"] not in PRIORIDADES:
        errores["prioridad"] = "debe ser baja, media o alta"
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
    hecha = request.args.get("hecha")
    if hecha in ("true", "false"):
        tareas = [tarea for tarea in tareas if tarea["hecha"] == (hecha == "true")]
    return [publica(tarea) for tarea in tareas]


@app.post("/v1/tareas")
@requiere_token
def crear(usuario):
    datos = datos_json()
    errores = validar(datos, parcial=False)
    if errores:
        return {"error": "Los datos no son válidos", "detalles": errores}, 422
    tarea = {
        "id": max(tarea["id"] for tarea in TAREAS) + 1,
        "titulo": datos["titulo"].strip(),
        "hecha": datos.get("hecha", False),
        "prioridad": datos.get("prioridad", "media"),
        "usuario": usuario,
    }
    TAREAS.append(tarea)
    return publica(tarea), 201, {"Location": url_for("ver", id=tarea["id"])}


@app.get("/v1/tareas/<int:id>")
@requiere_token
def ver(usuario, id):
    return publica(buscar(usuario, id))


@app.patch("/v1/tareas/<int:id>")
@requiere_token
def modificar(usuario, id):
    tarea = buscar(usuario, id)
    datos = datos_json()
    errores = validar(datos, parcial=True)
    if errores:
        return {"error": "Los datos no son válidos", "detalles": errores}, 422
    for campo in datos:
        tarea[campo] = datos[campo].strip() if campo == "titulo" else datos[campo]
    return publica(tarea)


@app.delete("/v1/tareas/<int:id>")
@requiere_token
def borrar(usuario, id):
    TAREAS.remove(buscar(usuario, id))
    return "", 204


if __name__ == "__main__":
    app.run(debug=True)
