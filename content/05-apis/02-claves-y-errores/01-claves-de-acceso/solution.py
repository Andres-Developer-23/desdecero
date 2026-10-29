import requests

CLAVE = "demo-clima-2026"
BASE = "https://api.clima.example/v1"

sesion = requests.Session()
sesion.headers["X-API-Key"] = CLAVE

ciudades = sesion.get(BASE + "/ciudades").json()
print("Ciudades con datos:", len(ciudades))

for ciudad in ["Bogotá", "Cartagena", "Leticia"]:
    respuesta = sesion.get(BASE + "/actual", params={"ciudad": ciudad})
    actual = respuesta.json()
    print(f"{actual['ciudad']}: {actual['temperatura']} °C, {actual['estado']}")

print("Peticiones restantes:", respuesta.headers["X-RateLimit-Remaining"])
