import csv
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

PORTADA = "https://libreria.example/"
CABECERAS = {"User-Agent": "BotDelCurso/1.0 (aprendiendo scraping)"}
COLUMNAS = ["titulo", "autor", "precio", "estrellas", "categoria", "ejemplares"]


def descargar(url):
    """Pide una página con cabeceras y pausa, y devuelve la sopa."""
    respuesta = requests.get(url, headers=CABECERAS, timeout=10)
    respuesta.raise_for_status()
    time.sleep(1)
    return BeautifulSoup(respuesta.text, "html.parser")


def a_numero(texto):
    return int("".join(c for c in texto if c.isdigit()))


def enlaces_del_catalogo():
    """Recorre el catálogo y devuelve las direcciones de todas las fichas."""
    enlaces = []
    # escribe aquí tu código
    return enlaces


def leer_ficha(url):
    """Visita una ficha y devuelve un diccionario con los datos del libro."""
    sopa = descargar(url)
    # escribe aquí tu código
    return {}


libros = [leer_ficha(url) for url in enlaces_del_catalogo()]

# Guarda libros.csv y muestra el resumen
