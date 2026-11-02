import json
import sys
from datetime import datetime

ARCHIVO = "tareas.json"
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
    # Tu código aquí: abre ARCHIVO y devuelve json.load(...); si no existe, []
    return []


def guardar(tareas):
    # Tu código aquí: escribe la lista en ARCHIVO con json.dump(...)
    pass


def agregar(tareas, argumentos):
    # Tu código aquí: comprueba que hay descripción, calcula el id,
    # añade la tarea, guarda e imprime "Tarea agregada (id: N)"
    pass


def listar(tareas, argumentos):
    # Tu código aquí
    pass


def main(argumentos):
    if not argumentos:
        print(USO)
        return
    orden, resto = argumentos[0], argumentos[1:]
    tareas = cargar()
    if orden == "agregar":
        agregar(tareas, resto)
    elif orden == "listar":
        listar(tareas, resto)
    # Tu código aquí: actualizar, eliminar, en-curso y hecha
    else:
        salir_con_error(f"Orden desconocida: {orden}\n\n{USO}")


main(sys.argv[1:])
