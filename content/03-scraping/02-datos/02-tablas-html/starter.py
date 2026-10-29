import requests
from bs4 import BeautifulSoup


def a_numero(texto):
    return int("".join(c for c in texto if c.isdigit()))


sopa = BeautifulSoup(requests.get("https://clima.example/").text, "html.parser")
tabla = sopa.find("table", id="pronostico")
ciudades = []

# Llena la lista con una fila por ciudad y muestra el resumen
