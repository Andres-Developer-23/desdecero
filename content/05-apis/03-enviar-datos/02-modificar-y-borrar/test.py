import websim

tareas = [t for t in websim.estado_api("api.tareas.example") if t["usuario"] == "ana"]
assert len(tareas) == 1, "Al terminar, a ana solo debería quedarle la tarea 1"
assert tareas[0]["titulo"] == "Comprar pan integral" and tareas[0]["prioridad"] == "baja", "La tarea 1 debería llamarse «Comprar pan integral» y conservar la prioridad baja"
assert websim.peticiones_a("PATCH", "/v1/tareas/2"), "Marca la tarea 2 como hecha con PATCH"
assert websim.peticiones_a("PUT", "/v1/tareas/1"), "Cambia la tarea 1 con PUT"
assert websim.peticiones_a("DELETE", "/v1/tareas/2") and websim.peticiones_a("DELETE", "/v1/tareas/3"), "Borra las tareas hechas con DELETE"
