import json
import time
from urllib.parse import urljoin
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup

PORTADA = "https://noticias.example/"
AGENTE = "BoletinBot"
CABECERAS = {"User-Agent": "BoletinBot/1.0 (proyecto del curso)"}

robots = RobotFileParser(urljoin(PORTADA, "robots.txt"))
robots.read()


def descargar(url):
    """La página como sopa, o None si robots.txt no la permite o no responde con 200."""
    if not robots.can_fetch(AGENTE, url):
        print(f"robots.txt no permite: {url}")
        return None
    respuesta = requests.get(url, headers=CABECERAS, timeout=10)
    time.sleep(1)
    if respuesta.status_code != 200:
        print(f"Error {respuesta.status_code}: {url}")
        return None
    return BeautifulSoup(respuesta.text, "html.parser")


def enlaces_de_portada():
    """Las direcciones completas de las noticias de la portada, en orden."""
    sopa = descargar(PORTADA)
    return [urljoin(PORTADA, noticia.h2.a["href"]) for noticia in sopa.find_all("article", class_="noticia")]


def leer_noticia(url):
    sopa = descargar(url)
    if sopa is None:
        return None
    articulo = sopa.find("article", class_="articulo")
    # El texto de la noticia: la entradilla y los párrafos, sin la línea de fecha y autor.
    parrafos = [p.get_text() for p in articulo.find_all("p") if "meta" not in p.get("class", [])]
    return {
        "titulo": articulo.h1.get_text(strip=True),
        "seccion": articulo.find("span", class_="seccion").get_text(strip=True),
        "fecha": articulo.time["datetime"],
        "autor": articulo.find("span", class_="autor").get_text(strip=True),
        "palabras": len(" ".join(parrafos).split()),
        "url": url,
    }


noticias = []
for enlace in enlaces_de_portada():
    noticia = leer_noticia(enlace)
    if noticia:
        noticias.append(noticia)

with open("boletin.json", "w", encoding="utf-8") as archivo:
    json.dump(noticias, archivo, ensure_ascii=False, indent=2)

secciones = {}
for noticia in noticias:
    secciones.setdefault(noticia["seccion"], []).append(noticia)

print(f"Boletín de La Gaceta de Ejemplo · {len(noticias)} noticias")
for seccion in sorted(secciones):
    print()
    print(f"{seccion} ({len(secciones[seccion])})")
    for noticia in secciones[seccion]:
        print(f"  {noticia['fecha']} · {noticia['titulo']} · {noticia['autor']} · {noticia['palabras']} palabras")

mas_larga = max(noticias, key=lambda noticia: noticia["palabras"])
print()
print(f"Palabras en total: {sum(noticia['palabras'] for noticia in noticias)}")
print(f"La más larga: {mas_larga['titulo']} ({mas_larga['palabras']} palabras)")
