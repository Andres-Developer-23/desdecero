import requests
from bs4 import BeautifulSoup


def a_numero(texto):
    """Convierte "$ 45.900" en 45900."""
    pass  # escribe aquí tu código


sopa = BeautifulSoup(requests.get("https://libreria.example/").text, "html.parser")
libros = []

# Llena la lista y muestra el resumen
