import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

PORTADA = "https://libreria.example/"


def descargar(url):
    return BeautifulSoup(requests.get(url).text, "html.parser")


def ejemplares(texto):
    if not texto.startswith("En stock"):
        return 0
    return int("".join(c for c in texto if c.isdigit()))


sopa = descargar(PORTADA)
for enlace in sopa.select(".libro__titulo a"):
    ficha = descargar(urljoin(PORTADA, enlace["href"]))
    titulo = ficha.h1.get_text()
    disponibilidad = ficha.find("p", class_="disponibilidad").get_text()
    print(f"{titulo}: {ejemplares(disponibilidad)}")
