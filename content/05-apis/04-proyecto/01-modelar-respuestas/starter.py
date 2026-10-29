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
        pass

    @property
    def destacado(self):
        """True si tiene valoración 5 y está disponible."""
        return False

    def etiqueta(self):
        return self.titulo


libros = []
url = "https://api.libreria.example/v1/libros?por_pagina=10"
# Recorre las páginas y convierte cada resultado en un Libro

print("Libros:", len(libros))
print("Destacados:")
