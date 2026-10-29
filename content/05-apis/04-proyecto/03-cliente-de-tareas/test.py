import websim

tareas = {t["id"]: t for t in websim.estado_api("api.tareas.example") if t["usuario"] == "ana"}
assert sorted(tareas) == [2, 3, 6, 7], "Al terminar, ana debería tener las tareas 2, 3, 6 y 7"
assert tareas[6]["hecha"] and tareas[6]["prioridad"] == "alta", "La tarea 6 debería estar hecha y tener prioridad alta"
for peticion in websim.peticiones():
    assert peticion["timeout"] == 5, "_pedir() debería pasar timeout=5 en todas las peticiones"
    if not peticion["url"].endswith("/token"):
        assert websim.cabecera(peticion, "Authorization") == "Bearer tk-ana-5f2b9c", "Guarda el token en la cabecera Authorization de la sesión"
assert any("hecha=false" in url for url in websim.urls_pedidas()), "pendientes() debería pedir solo las tareas sin hacer, con hecha=false"
assert websim.peticiones_a("PATCH", "/v1/tareas/99"), "completar(99) debería hacer un PATCH a /v1/tareas/99"
