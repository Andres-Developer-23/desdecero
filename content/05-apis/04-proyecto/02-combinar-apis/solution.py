import requests

LIBRERIA = "https://api.libreria.example/v1"
CAMBIO = "https://api.cambio.example/v1"

libros = requests.get(LIBRERIA + "/libros", params={"categoria": "Programación", "por_pagina": 10}).json()["resultados"]
tasas = requests.get(CAMBIO + "/tasas", params={"base": "COP"}).json()["tasas"]

total = 0
for libro in libros:
    precio = libro["precio"]
    total += precio
    print(f"{libro['titulo']}: {precio} COP = {precio * tasas['USD']:.2f} USD = {precio * tasas['EUR']:.2f} EUR")

print(f"Total: {total} COP = {total * tasas['USD']:.2f} USD = {total * tasas['EUR']:.2f} EUR")
