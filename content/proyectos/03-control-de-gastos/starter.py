import csv
from datetime import date

ARCHIVO = "gastos.csv"
COLUMNAS = ["id", "fecha", "descripcion", "categoria", "importe"]
MENU = """
=== Control de gastos ===
1. Añadir un gasto
2. Ver los gastos
3. Resumen
4. Borrar un gasto
5. Salir"""


def cargar():
    """Los gastos guardados, con el id como entero y el importe como número."""
    # Tu código aquí: lee ARCHIVO con csv.DictReader; si no existe, []
    return []


def guardar(gastos):
    # Tu código aquí: escribe los gastos con csv.DictWriter (y la cabecera)
    pass


def anadir(gastos):
    # Tu código aquí
    pass


def ver(gastos):
    # Tu código aquí
    pass


def resumen(gastos):
    # Tu código aquí
    pass


def borrar(gastos):
    # Tu código aquí
    pass


def main():
    gastos = cargar()
    while True:
        print(MENU)
        opcion = input("Elige una opción: ").strip()
        # Tu código aquí: llama a la función de cada opción
        if opcion == "5":
            print("¡Hasta pronto!")
            break


main()
