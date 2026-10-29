import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

url = "https://refranes.example/"
refranes = 0
paginas = 0
conteo = {}

while url:
    sopa = BeautifulSoup(requests.get(url).text, "html.parser")
    paginas += 1
    for refran in sopa.select(".refran"):
        refranes += 1
        for tema in refran.select(".tema"):
            nombre = tema.get_text()
            conteo[nombre] = conteo.get(nombre, 0) + 1
    siguiente = sopa.select_one("li.siguiente a")
    url = urljoin(url, siguiente["href"]) if siguiente else None

print("Refranes:", refranes)
print("Páginas:", paginas)
for tema in sorted(conteo):
    if conteo[tema] >= 3:
        print(f"{tema}: {conteo[tema]}")
