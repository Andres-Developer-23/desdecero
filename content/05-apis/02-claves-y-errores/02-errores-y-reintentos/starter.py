import requests
import time

BASE = "https://api.clima.example/v1"
CIUDADES = ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Pasto"]
reintentos = 0

sesion = requests.Session()
sesion.headers["X-API-Key"] = "demo-clima-2026"


def pedir(sesion, ruta, params):
    """Pide BASE + ruta y reintenta si la API responde 429 o 503."""
    respuesta = sesion.get(BASE + ruta, params=params)
    return respuesta.json()


alertas = pedir(sesion, "/alertas", {"ciudad": "Leticia"})
print(alertas)

for ciudad in CIUDADES:
    actual = pedir(sesion, "/actual", {"ciudad": ciudad})
    print(actual)

print("Reintentos:", reintentos)
