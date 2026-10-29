import requests
from bs4 import BeautifulSoup

respuesta = requests.get("https://noticias.example/")
sopa = BeautifulSoup(respuesta.text, "html.parser")

# Recorre las noticias y muestra cada una
