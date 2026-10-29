import time
import requests
from bs4 import BeautifulSoup
from urllib.robotparser import RobotFileParser

CABECERAS = {"User-Agent": "BotDelCurso/1.0 (aprendiendo scraping)"}
URLS = [
    "https://noticias.example/2026/10/26/la-biblioteca-municipal-abrira-tambien-de-noche.html",
    "https://noticias.example/borradores/proxima-portada.html",
    "https://noticias.example/2026/10/20/esta-noticia-no-existe.html",
    "https://noticias.example/2026/10/23/vuelve-la-feria-del-libro-con-120-expositores.html",
    "https://noticias.example/2026/10/21/la-orquesta-juvenil-gana-un-concurso-nacional.html",
]

# Lee robots.txt y recorre las direcciones
