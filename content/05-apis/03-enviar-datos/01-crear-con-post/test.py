import websim

tareas = [t for t in websim.estado_api("api.tareas.example") if t["usuario"] == "ana"]
creadas = [t for t in tareas if t["id"] > 5]
assert [(t["titulo"], t["prioridad"]) for t in creadas] == [("Preparar la presentación", "alta"), ("Comprar café", "media")], "Crea las dos tareas válidas de la lista, en orden"
posts = websim.peticiones_a("POST", "/v1/tareas")
for peticion in posts:
    assert websim.cabecera(peticion, "Content-Type") == "application/json", "Envía las tareas en JSON, con json="
    assert websim.cabecera(peticion, "Authorization") == "Bearer tk-ana-5f2b9c", "Envía el token en la cabecera Authorization: Bearer <token>"
assert websim.peticiones_a("POST", "/v1/token"), "Consigue el token con POST /v1/token"
