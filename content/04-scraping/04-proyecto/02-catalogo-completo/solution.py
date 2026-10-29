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
    url = PORTADA
    while url:
        sopa = descargar(url)
        for enlace in sopa.select(".libro__titulo a"):
            enlaces.append(urljoin(url, enlace["href"]))
        siguiente = sopa.select_one("li.siguiente a")
        url = urljoin(url, siguiente["href"]) if siguiente else None
    return enlaces


def leer_ficha(url):
    """Visita una ficha y devuelve un diccionario con los datos del libro."""
    sopa = descargar(url)
    estrellas = 0
    for clase in sopa.select_one(".estrellas")["class"]:
        if clase.startswith("estrellas-"):
            estrellas = int(clase.split("-")[1])
    disponibilidad = sopa.select_one(".disponibilidad").get_text()
    return {
        "titulo": sopa.h1.get_text(),
        "autor": sopa.select_one(".autor").get_text(),
        "precio": a_numero(sopa.select_one(".precio").get_text()),
        "estrellas": estrellas,
        "categoria": sopa.find("th", string="Categoría").find_next_sibling("td").get_text(),
        "ejemplares": a_numero(disponibilidad) if disponibilidad.startswith("En stock") else 0,
    }


libros = [leer_ficha(url) for url in enlaces_del_catalogo()]

with open("libros.csv", "w", newline="", encoding="utf-8") as archivo:
    escritor = csv.DictWriter(archivo, fieldnames=COLUMNAS)
    escritor.writeheader()
    escritor.writerows(libros)

agotados = len([libro for libro in libros if libro["ejemplares"] == 0])
medio = sum(libro["precio"] for libro in libros) / len(libros)
conteo = {}
for libro in libros:
    conteo[libro["categoria"]] = conteo.get(libro["categoria"], 0) + 1
categoria = max(conteo, key=conteo.get)

print("Libros guardados:", len(libros))
print("Agotados:", agotados)
print("Precio medio:", round(medio))
print(f"Categoría con más libros: {categoria} ({conteo[categoria]})")
