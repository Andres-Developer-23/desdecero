import requests

BASE = "https://api.tareas.example/v1"
nuevas = [
    {"titulo": "Preparar la presentación", "prioridad": "alta"},
    {"titulo": "Comprar café"},
    {"titulo": ""},
]

sesion = requests.Session()
token = sesion.post(BASE + "/token", json={"usuario": "ana", "clave": "python123"}).json()["token"]
sesion.headers["Authorization"] = f"Bearer {token}"

for datos in nuevas:
    respuesta = sesion.post(BASE + "/tareas", json=datos)
    if respuesta.status_code == 201:
        tarea = respuesta.json()
        print(f"Creada la tarea {tarea['id']}: {tarea['titulo']}")
    elif respuesta.status_code == 422:
        for campo, problema in respuesta.json()["detalles"].items():
            print("No se pudo crear:", campo, problema)

print("Tus tareas:")
for tarea in sesion.get(BASE + "/tareas").json():
    marca = "[x]" if tarea["hecha"] else "[ ]"
    print(marca, tarea["id"], tarea["titulo"], f"({tarea['prioridad']})")
