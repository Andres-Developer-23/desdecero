import csv
import requests
from bs4 import BeautifulSoup


def a_numero(texto):
    return int("".join(c for c in texto if c.isdigit()))


sopa = BeautifulSoup(requests.get("https://clima.example/").text, "html.parser")
ciudades = []
for fila in sopa.select("#pronostico tbody tr"):
    celdas = [celda.get_text(strip=True) for celda in fila.find_all(["th", "td"])]
    ciudades.append({
        "ciudad": celdas[0],
        "maxima": a_numero(celdas[1]),
        "minima": a_numero(celdas[2]),
        "lluvia": a_numero(celdas[3]),
        "cielo": celdas[4],
    })

with open("clima.csv", "w", newline="", encoding="utf-8") as archivo:
    escritor = csv.DictWriter(archivo, fieldnames=["ciudad", "maxima", "minima", "lluvia", "cielo"])
    escritor.writeheader()
    escritor.writerows(ciudades)

with open("clima.csv", newline="", encoding="utf-8") as archivo:
    filas = list(csv.DictReader(archivo))
print(f"Guardadas {len(filas)} ciudades en clima.csv")
