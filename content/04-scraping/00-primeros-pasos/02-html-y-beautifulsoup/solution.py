import requests
from bs4 import BeautifulSoup

respuesta = requests.get("https://clima.example/")
sopa = BeautifulSoup(respuesta.text, "html.parser")
print(sopa.title.string)
print(sopa.h1.get_text())
print(sopa.p.get_text())
