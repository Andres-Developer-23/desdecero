import requests

BASE = "https://api.tareas.example/v1"
nuevas = [
    {"titulo": "Preparar la presentación", "prioridad": "alta"},
    {"titulo": "Comprar café"},
    {"titulo": ""},
]

sesion = requests.Session()

# 1. Inicia sesión y guarda el token en la cabecera Authorization

# 2. Crea cada tarea de la lista y muestra el resultado
for datos in nuevas:
    respuesta = sesion.post(BASE + "/tareas", data=datos)
    print(respuesta.status_code)

# 3. Muestra todas tus tareas
