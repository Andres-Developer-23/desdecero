import requests

LIBRERIA = "https://api.libreria.example/v1"
CAMBIO = "https://api.cambio.example/v1"

libros = requests.get(LIBRERIA + "/libros", params={"categoria": "Programación", "por_pagina": 10}).json()["resultados"]

total = 0
for libro in libros:
    conversion = requests.get(CAMBIO + "/convertir", params={"de": "COP", "a": "USD", "cantidad": libro["precio"]}).json()
    print(libro["titulo"], conversion["resultado"])
