import requests

BASE = "https://api.tareas.example/v1"
TOKEN = "tk-ana-5f2b9c"

sesion = requests.Session()
sesion.headers["Authorization"] = f"Bearer {TOKEN}"

for tarea in sesion.get(BASE + "/tareas").json():
    if not tarea["hecha"] and tarea["prioridad"] == "alta":
        actualizada = sesion.patch(f"{BASE}/tareas/{tarea['id']}", json={"hecha": True}).json()
        print("Completada:", actualizada["titulo"])

renombrada = sesion.put(BASE + "/tareas/1", json={"titulo": "Comprar pan integral", "prioridad": "baja"}).json()
print(f"Renombrada: {renombrada['titulo']} ({renombrada['prioridad']})")

for tarea in sesion.get(BASE + "/tareas").json():
    if tarea["hecha"]:
        respuesta = sesion.delete(f"{BASE}/tareas/{tarea['id']}")
        if respuesta.status_code == 204:
            print("Borrada:", tarea["id"])

print("Tareas que quedan:")
for tarea in sesion.get(BASE + "/tareas").json():
    marca = "[x]" if tarea["hecha"] else "[ ]"
    print(marca, tarea["id"], tarea["titulo"], f"({tarea['prioridad']})")
