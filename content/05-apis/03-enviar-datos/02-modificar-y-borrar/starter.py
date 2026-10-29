import requests

BASE = "https://api.tareas.example/v1"
TOKEN = "tk-ana-5f2b9c"

sesion = requests.Session()
sesion.headers["Authorization"] = f"Bearer {TOKEN}"

tareas = sesion.get(BASE + "/tareas").json()

# 1. Marca como hechas las pendientes de prioridad alta (PATCH)

# 2. Cambia el título de la tarea 1, conservando su prioridad (PUT)

# 3. Borra las tareas hechas (DELETE)

# 4. Muestra las que quedan
print("Tareas que quedan:")
for tarea in tareas:
    print(tarea)
