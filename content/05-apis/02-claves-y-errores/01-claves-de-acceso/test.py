import websim

peticiones = websim.peticiones()
assert len(peticiones) == 4, "Haz 4 peticiones: las ciudades y el tiempo de 3 ciudades. Tu programa hizo " + str(len(peticiones))
for peticion in peticiones:
    assert websim.cabecera(peticion, "X-API-Key") == "demo-clima-2026", "Envía la clave en la cabecera X-API-Key de todas las peticiones (falta en " + peticion["url"] + ")"
