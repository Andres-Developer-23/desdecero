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
    try:
        with open(ARCHIVO, encoding="utf-8", newline="") as archivo:
            filas = list(csv.DictReader(archivo))
    except FileNotFoundError:
        return []
    for fila in filas:
        fila["id"] = int(fila["id"])
        fila["importe"] = float(fila["importe"])
    return filas


def guardar(gastos):
    with open(ARCHIVO, "w", encoding="utf-8", newline="") as archivo:
        escritor = csv.DictWriter(archivo, fieldnames=COLUMNAS)
        escritor.writeheader()
        for gasto in gastos:
            escritor.writerow(dict(gasto, importe=f"{gasto['importe']:.2f}"))


def es_fecha(texto):
    """True si el texto es una fecha de verdad escrita como AAAA-MM-DD."""
    partes = texto.split("-")
    if len(partes) != 3 or not all(parte.isdigit() for parte in partes) or len(partes[0]) != 4:
        return False
    try:
        date(int(partes[0]), int(partes[1]), int(partes[2]))
    except ValueError:
        return False
    return True


def es_mes(texto):
    """True si el texto es un mes escrito como AAAA-MM."""
    partes = texto.split("-")
    return (
        len(partes) == 2
        and len(partes[0]) == 4
        and len(partes[1]) == 2
        and all(parte.isdigit() for parte in partes)
        and 1 <= int(partes[1]) <= 12
    )


def pedir_fecha():
    while True:
        texto = input("Fecha (AAAA-MM-DD): ").strip()
        if es_fecha(texto):
            return texto
        print("Fecha no válida: escríbela como AAAA-MM-DD (por ejemplo, 2026-10-03).")


def pedir_texto(pregunta):
    while True:
        texto = input(pregunta).strip()
        if texto:
            return texto
        print("Este dato no puede quedar vacío.")


def pedir_importe():
    while True:
        texto = input("Importe: ").strip().replace(",", ".")
        try:
            importe = float(texto)
        except ValueError:
            importe = 0
        if importe > 0:
            return importe
        print("El importe debe ser un número mayor que 0.")


def anadir(gastos):
    ids = [gasto["id"] for gasto in gastos]
    gasto = {
        "id": max(ids) + 1 if ids else 1,
        "fecha": pedir_fecha(),
        "descripcion": pedir_texto("Descripción: "),
        "categoria": pedir_texto("Categoría: ").lower(),
        "importe": pedir_importe(),
    }
    gastos.append(gasto)
    guardar(gastos)
    print(f"Gasto añadido (id: {gasto['id']}).")


def ver(gastos):
    if not gastos:
        print("No hay gastos.")
        return
    print(f"{'ID':>3}  {'Fecha':<10}  {'Categoría':<12}  {'Importe':>9}  Descripción")
    for gasto in sorted(gastos, key=lambda g: g["fecha"]):
        print(
            f"{gasto['id']:>3}  {gasto['fecha']}  {gasto['categoria']:<12}  "
            f"{gasto['importe']:>9.2f}  {gasto['descripcion']}"
        )


def resumen(gastos):
    while True:
        mes = input("Mes (AAAA-MM, vacío para todos): ").strip()
        if not mes or es_mes(mes):
            break
        print("Mes no válido: escríbelo como AAAA-MM (por ejemplo, 2026-10).")
    if mes:
        gastos = [gasto for gasto in gastos if gasto["fecha"].startswith(mes + "-")]
    if not gastos:
        print(f"No hay gastos en {mes}." if mes else "No hay gastos.")
        return
    total = sum(gasto["importe"] for gasto in gastos)
    por_categoria = {}
    for gasto in gastos:
        por_categoria[gasto["categoria"]] = por_categoria.get(gasto["categoria"], 0) + gasto["importe"]
    titulo = f"de {mes}" if mes else "de todos los gastos"
    print(f"Resumen {titulo} ({len(gastos)} gastos)")
    for categoria, importe in sorted(por_categoria.items(), key=lambda par: par[1], reverse=True):
        print(f"  {categoria:<12}  {importe:>9.2f}  {importe / total:>4.0%}")
    print(f"Total: {total:.2f}")


def borrar(gastos):
    texto = input("ID del gasto a borrar: ").strip()
    if not texto.isdigit():
        print("Escribe el número del gasto.")
        return
    for gasto in gastos:
        if gasto["id"] == int(texto):
            gastos.remove(gasto)
            guardar(gastos)
            print(f"Gasto {texto} borrado.")
            return
    print(f"No existe el gasto {texto}.")


def main():
    gastos = cargar()
    while True:
        print(MENU)
        opcion = input("Elige una opción: ").strip()
        if opcion == "1":
            anadir(gastos)
        elif opcion == "2":
            ver(gastos)
        elif opcion == "3":
            resumen(gastos)
        elif opcion == "4":
            borrar(gastos)
        elif opcion == "5":
            print("¡Hasta pronto!")
            break
        else:
            print("Opción no válida: elige un número del 1 al 5.")


main()
