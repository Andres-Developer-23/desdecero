import requests
from bs4 import BeautifulSoup

respuesta = requests.get("https://noticias.example/")
sopa = BeautifulSoup(respuesta.text, "html.parser")

noticias = sopa.find_all("article", class_="noticia")
for noticia in noticias:
    seccion = noticia.find("span", class_="seccion").get_text()
    titular = noticia.find("h2").get_text()
    print(f"[{seccion}] {titular}")
print(len(noticias), "noticias")
