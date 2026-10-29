import requests
from bs4 import BeautifulSoup

respuesta = requests.get("https://clima.example/")
# Analiza el HTML y muestra los tres textos
