cliente = app.test_client()
token = cliente.post("/v1/token", json={"usuario": "ana", "clave": "python123"}).get_json()["token"]
ana = {"Authorization": "Bearer " + token}
luis = {"Authorization": "Bearer tk-luis-8d41e7"}


def ids(respuesta):
    return [tarea["id"] for tarea in respuesta.get_json()]


assert cliente.get("/v1/tareas").status_code == 401, "GET /v1/tareas sin token debería responder 401"
assert ids(cliente.get("/v1/tareas?hecha=false", headers=ana)) == [1, 2], "?hecha=false debería dar las tareas pendientes de ana (1 y 2)"
assert ids(cliente.get("/v1/tareas?hecha=true", headers=ana)) == [3], "?hecha=true debería dar las tareas hechas de ana (3)"
assert ids(cliente.get("/v1/tareas", headers=ana)) == [1, 2, 3], "Sin filtro, ana debería ver sus 3 tareas"

r = cliente.post("/v1/tareas", json={"titulo": "  Repasar Flask  "}, headers=ana)
assert r.status_code == 201, "POST /v1/tareas debería responder 201, y responde " + str(r.status_code) + " " + r.get_data(as_text=True)
assert r.get_json() == {"id": 5, "titulo": "Repasar Flask", "hecha": False, "prioridad": "media"}, "La tarea creada debería ser " + str({"id": 5, "titulo": "Repasar Flask", "hecha": False, "prioridad": "media"}) + " y es " + r.get_data(as_text=True)
assert r.headers.get("Location") == "/v1/tareas/5", "Añade la cabecera Location con url_for(): debería ser /v1/tareas/5"
r = cliente.post("/v1/tareas", json={"titulo": "Leer", "hecha": True, "prioridad": "alta"}, headers=luis)
assert r.get_json() == {"id": 6, "titulo": "Leer", "hecha": True, "prioridad": "alta"}, "POST con hecha y prioridad debería guardarlas"

esperado = {"error": "Los datos no son válidos", "detalles": {"title": "campo desconocido", "titulo": "es obligatorio", "hecha": "debe ser true o false", "prioridad": "debe ser baja, media o alta"}}
r = cliente.post("/v1/tareas", json={"title": "x", "hecha": "no", "prioridad": "urgente"}, headers=ana)
assert r.status_code == 422 and r.get_json() == esperado, "Los datos no válidos deberían responder 422 con " + str(esperado) + ", y responde " + str(r.status_code) + " " + r.get_data(as_text=True)
r = cliente.post("/v1/tareas", json={"titulo": "x" * 81}, headers=ana)
assert r.status_code == 422 and r.get_json()["detalles"] == {"titulo": "admite como máximo 80 caracteres"}, "Un título de más de 80 caracteres no es válido"
r = cliente.post("/v1/tareas", json={"titulo": " "}, headers=ana)
assert r.get_json()["detalles"] == {"titulo": "no puede estar vacío"}, "Un título vacío no es válido"
assert cliente.post("/v1/tareas", data="titulo=x", headers=ana).status_code == 400, "Si no llega JSON, la API debería responder 400 (usa datos_json())"

r = cliente.patch("/v1/tareas/2", json={"hecha": True}, headers=ana)
assert r.status_code == 200 and r.get_json() == {"id": 2, "titulo": "Terminar el curso de Python", "hecha": True, "prioridad": "alta"}, "PATCH debería cambiar solo hecha, y responde " + r.get_data(as_text=True)
r = cliente.patch("/v1/tareas/2", json={"titulo": " Terminar la ruta de Flask "}, headers=ana)
assert r.get_json()["titulo"] == "Terminar la ruta de Flask", "PATCH debería guardar el título sin espacios en los extremos"
assert cliente.patch("/v1/tareas/2", json={"prioridad": "máxima"}, headers=ana).status_code == 422, "PATCH también valida los datos"
assert cliente.patch("/v1/tareas/4", json={"hecha": True}, headers=ana).status_code == 404, "La tarea 4 es de luis: para ana no existe (404)"

r = cliente.delete("/v1/tareas/1", headers=ana)
assert r.status_code == 204 and r.get_data(as_text=True) == "", "DELETE debería responder 204 sin cuerpo"
r = cliente.get("/v1/tareas/1", headers=ana)
assert r.status_code == 404 and r.get_json() == {"error": "No tienes ninguna tarea con id 1"}, "Después de borrarla, la tarea 1 no debería existir"
assert cliente.delete("/v1/tareas/4", headers=ana).status_code == 404, "ana no puede borrar las tareas de luis"
