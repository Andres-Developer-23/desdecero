import csv
import requests
from bs4 import BeautifulSoup


def a_numero(texto):
    return int("".join(c for c in texto if c.isdigit()))


sopa = BeautifulSoup(requests.get("https://clima.example/").text, "html.parser")
ciudades = []
for fila in sopa.select("#pronostico tbody tr"):
    celdas = [celda.get_text(strip=True) for celda in fila.find_all(["th", "td"])]
    # Añade a ciudades un diccionario con las cinco columnas

# Guarda clima.csv, vuelve a leerlo y muestra cuántas filas tiene
