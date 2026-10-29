import requests
from bs4 import BeautifulSoup

sopa = BeautifulSoup(requests.get("https://libreria.example/").text, "html.parser")

for titulo in sopa.find_all("h3", class_="libro__titulo"):
    enlace = titulo.find("a")
    print(enlace["title"], "->", enlace["href"])
