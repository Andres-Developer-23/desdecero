import requests

url = "https://api.libreria.example/v1/libros?por_pagina=5"
libros = []

datos = requests.get(url).json()
libros.extend(datos["resultados"])

# Sigue el enlace "siguiente" hasta llegar a la última página

print("Libros:", len(libros))
