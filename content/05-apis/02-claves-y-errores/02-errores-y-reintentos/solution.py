import requests
import time

BASE = "https://api.clima.example/v1"
CIUDADES = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Pasto"]
reintentos = 0

sesion = requests.Session()
sesion.headers["X-API-Key"] = "demo-clima-2026"


def pedir(sesion, ruta, params):
    """Pide BASE + ruta y reintenta si la API responde 429 o 503."""
    global reintentos
    for intento in range(5):
        respuesta = sesion.get(BASE + ruta, params=params, timeout=5)
        if respuesta.status_code in (429, 503):
            time.sleep(int(respuesta.headers.get("Retry-After", 1)))
            reintentos += 1
            continue
        respuesta.raise_for_status()
        return respuesta.json()
    respuesta.raise_for_status()


datos = pedir(sesion, "/alertas", {"ciudad": "Leticia"})
for alerta in datos["alertas"]:
    print("Alertas en Leticia:", alerta["mensaje"])

for ciudad in CIUDADES:
    actual = pedir(sesion, "/actual", {"ciudad": ciudad})
    print(f"{actual['ciudad']}: {actual['temperatura']} °C")

print("Reintentos:", reintentos)
