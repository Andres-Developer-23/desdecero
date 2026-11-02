import json
import sys
from datetime import datetime

ARCHIVO = "tareas.json"
MARCAS = {"pendiente": "[ ]", "en-curso": "[~]", "hecha": "[x]"}
FILTROS = {"pendientes": "pendiente", "en-curso": "en-curso", "hechas": "hecha"}
USO = """Uso: python tareas.py <orden> [argumentos]

Órdenes:
  agregar "descripción"            apunta una tarea nueva
  actualizar <id> "descripción"    cambia la descripción de una tarea
  eliminar <id>                    borra una tarea
  en-curso <id>                    marca una tarea como en curso
  hecha <id>                       marca una tarea como hecha
  listar [pendientes|en-curso|hechas]"""


def salir_con_error(mensaje):
    """Explica el error en la salida de errores y termina con el código 1."""
    print(f"Error: {mensaje}", file=sys.stderr)
    sys.exit(1)


def ahora():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def cargar():
    """Las tareas guardadas, o una lista vacía si todavía no hay archivo."""
    try:
        with open(ARCHIVO, encoding="utf-8") as archivo:
            return json.load(archivo)
    except FileNotFoundError:
        return []


def guardar(tareas):
    with open(ARCHIVO, "w", encoding="utf-8") as archivo:
        json.dump(tareas, archivo, ensure_ascii=False, indent=2)


def leer_id(argumentos):
    if not argumentos:
        salir_con_error("Falta el id de la tarea")
    try:
        return int(argumentos[0])
    except ValueError:
        salir_con_error(f"El id debe ser un número: {argumentos[0]}")


def buscar(tareas, id_tarea):
    for tarea in tareas:
        if tarea["id"] == id_tarea:
            return tarea
    salir_con_error(f"No existe la tarea {id_tarea}")


def agregar(tareas, argumentos):
    if not argumentos or not argumentos[0].strip():
        salir_con_error("Falta la descripción de la tarea")
    ids = [tarea["id"] for tarea in tareas]
    nueva = {
        "id": max(ids) + 1 if ids else 1,
        "descripcion": argumentos[0].strip(),
        "estado": "pendiente",
        "creada": ahora(),
        "actualizada": ahora(),
    }
    tareas.append(nueva)
    guardar(tareas)
    print(f"Tarea agregada (id: {nueva['id']})")


def actualizar(tareas, argumentos):
    tarea = buscar(tareas, leer_id(argumentos))
    if len(argumentos) < 2 or not argumentos[1].strip():
        salir_con_error("Falta la descripción nueva")
    tarea["descripcion"] = argumentos[1].strip()
    tarea["actualizada"] = ahora()
    guardar(tareas)
    print(f"Tarea {tarea['id']} actualizada")


def eliminar(tareas, argumentos):
    tarea = buscar(tareas, leer_id(argumentos))
    tareas.remove(tarea)
    guardar(tareas)
    print(f"Tarea {tarea['id']} eliminada")


def cambiar_estado(tareas, argumentos, estado):
    tarea = buscar(tareas, leer_id(argumentos))
    tarea["estado"] = estado
    tarea["actualizada"] = ahora()
    guardar(tareas)
    print(f"Tarea {tarea['id']}: {estado.replace('-', ' ')}")


def listar(tareas, argumentos):
    if argumentos:
        if argumentos[0] not in FILTROS:
            salir_con_error(f"Filtro desconocido: {argumentos[0]} (usa pendientes, en-curso o hechas)")
        tareas = [tarea for tarea in tareas if tarea["estado"] == FILTROS[argumentos[0]]]
    if not tareas:
        print("No hay tareas.")
    for tarea in tareas:
        print(f"{MARCAS[tarea['estado']]} {tarea['id']} · {tarea['descripcion']}")


def main(argumentos):
    if not argumentos:
        print(USO)
        return
    orden, resto = argumentos[0], argumentos[1:]
    tareas = cargar()
    if orden == "agregar":
        agregar(tareas, resto)
    elif orden == "actualizar":
        actualizar(tareas, resto)
    elif orden == "eliminar":
        eliminar(tareas, resto)
    elif orden in ("en-curso", "hecha"):
        cambiar_estado(tareas, resto, orden)
    elif orden == "listar":
        listar(tareas, resto)
    else:
        salir_con_error(f"Orden desconocida: {orden}\n\n{USO}")


main(sys.argv[1:])
