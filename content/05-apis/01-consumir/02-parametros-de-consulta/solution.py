import requests

URL = "https://api.libreria.example/v1/libros"

filtros = {"disponible": "true", "precio_max": 50000, "orden": "precio", "por_pagina": 10}
datos = requests.get(URL, params=filtros).json()

print("Encontrados:", datos["total"])
for libro in datos["resultados"]:
    print(libro["precio"], "·", libro["titulo"])

primero = datos["resultados"][0]
detalle = requests.get(f"{URL}/{primero['id']}").json()
print(f"El más barato: {detalle['titulo']} ({detalle['editorial']}, {detalle['paginas']} páginas)")
