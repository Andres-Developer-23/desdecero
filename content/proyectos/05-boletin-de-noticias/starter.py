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
    # Tu código aquí: comprueba robots, pide la página con CABECERAS y timeout,
    # espera 1 segundo y devuelve la sopa


def enlaces_de_portada():
    """Las direcciones completas de las noticias de la portada, en orden."""
    # Tu código aquí


def leer_noticia(url):
    """Un diccionario con los datos de la noticia, o None si no se pudo descargar."""
    # Tu código aquí


noticias = []
# Tu código aquí: lee cada noticia, guarda boletin.json y escribe el boletín
