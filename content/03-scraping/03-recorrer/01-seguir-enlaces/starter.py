import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

PORTADA = "https://libreria.example/"


def descargar(url):
    return BeautifulSoup(requests.get(url).text, "html.parser")


sopa = descargar(PORTADA)
# Visita la página de cada libro y muestra sus ejemplares
