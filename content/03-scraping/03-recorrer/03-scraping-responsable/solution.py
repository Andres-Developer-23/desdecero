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

robots = RobotFileParser("https://noticias.example/robots.txt")
robots.read()

for url in URLS:
    if not robots.can_fetch("BotDelCurso", url):
        print("Prohibida:", url)
        continue
    respuesta = requests.get(url, headers=CABECERAS, timeout=10)
    if respuesta.status_code == 200:
        sopa = BeautifulSoup(respuesta.text, "html.parser")
        print(sopa.h1.get_text())
    else:
        print(f"Error {respuesta.status_code}: {url}")
    time.sleep(1)
