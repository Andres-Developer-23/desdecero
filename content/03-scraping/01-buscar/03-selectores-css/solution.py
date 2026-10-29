import requests
from bs4 import BeautifulSoup

sopa = BeautifulSoup(requests.get("https://libreria.example/").text, "html.parser")

for libro in sopa.select("article.libro"):
    titulo = libro.select_one(".libro__titulo a")["title"]
    precio = libro.select_one(".precio").get_text()
    disponibilidad = libro.select_one(".disponibilidad").get_text()
    print(f"{titulo} | {precio} | {disponibilidad}")
