import requests

url = "https://api.libreria.example/v1/libros?por_pagina=5"
libros = []
paginas = 0

while url:
    datos = requests.get(url).json()
    paginas += 1
    libros.extend(datos["resultados"])
    url = datos["siguiente"]

media = sum(libro["valoracion"] for libro in libros) / len(libros)
agotados = [libro["titulo"] for libro in libros if not libro["disponible"]]

print("Páginas:", paginas)
print("Libros:", len(libros))
print("Valoración media:", round(media, 1))
print("Agotados:", ", ".join(agotados))
