import websim

peticiones = websim.peticiones()
for peticion in peticiones:
    assert peticion["timeout"] == 5, "Pasa timeout=5 en todas las peticiones (falta en " + peticion["url"] + ")"
for anterior, siguiente in zip(peticiones, peticiones[1:]):
    if anterior["estado"] in (429, 503):
        assert siguiente["segundo"] - anterior["segundo"] >= 1, "Después de un " + str(anterior["estado"]) + " espera los segundos de Retry-After antes de reintentar"
estados = [p["estado"] for p in peticiones]
assert estados.count(429) >= 1 and estados[-1] == 200, "Tu programa debería reintentar hasta conseguir todas las respuestas"
assert reintentos == estados.count(429) + estados.count(503), "reintentos debería contar los 429 y 503 que recibiste"
