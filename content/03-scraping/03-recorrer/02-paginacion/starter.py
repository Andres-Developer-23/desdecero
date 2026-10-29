import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

url = "https://refranes.example/"
refranes = 0
paginas = 0
conteo = {}

# Recorre las páginas con un bucle while
