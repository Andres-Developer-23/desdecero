import json
from dataclasses import asdict, dataclass

import requests


@dataclass
class Libro:
    id: int
    titulo: str
    autor: str
    precio: int
    valoracion: int
    disponible: bool

    @classmethod
    def desde_json(cls, datos):
        """Crea un Libro a partir de un resultado de la API."""
        return cls(
            id=datos["id"],
            titulo=datos["titulo"],
            autor=datos["autor"],
            precio=datos["precio"],
            valoracion=datos["valoracion"],
            disponible=datos["disponible"],
        )

    @property
    def destacado(self):
        """True si tiene valoración 5 y está disponible."""
        return self.valoracion == 5 and self.disponible

    def etiqueta(self):
        return f"{self.titulo} — {self.autor} ({self.precio})"


libros = []
url = "https://api.libreria.example/v1/libros?por_pagina=10"
while url:
    datos = requests.get(url).json()
    for resultado in datos["resultados"]:
        libros.append(Libro.desde_json(resultado))
    url = datos["siguiente"]

destacados = [libro for libro in libros if libro.destacado]

print("Libros:", len(libros))
print("Destacados:")
for libro in destacados:
    print("-", libro.etiqueta())

with open("destacados.json", "w", encoding="utf-8") as archivo:
    json.dump([asdict(libro) for libro in destacados], archivo, indent=2, ensure_ascii=False)
