import requests

CLAVE = "demo-clima-2026"
BASE = "https://api.clima.example/v1"

sesion = requests.Session()

# 1. Pide las ciudades
respuesta = sesion.get(BASE + "/ciudades")
print(respuesta.status_code, respuesta.json())

# 2. El tiempo actual de Bogotá, Cartagena y Leticia

# 3. Las peticiones que te quedan
