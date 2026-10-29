import requests
from bs4 import BeautifulSoup


def a_numero(texto):
    return int("".join(c for c in texto if c.isdigit()))


sopa = BeautifulSoup(requests.get("https://clima.example/").text, "html.parser")
tabla = sopa.find("table", id="pronostico")
ciudades = []
for fila in tabla.tbody.find_all("tr"):
    celdas = [celda.get_text(strip=True) for celda in fila.find_all(["th", "td"])]
    ciudades.append({
        "ciudad": celdas[0],
        "maxima": a_numero(celdas[1]),
        "minima": a_numero(celdas[2]),
        "lluvia": a_numero(celdas[3]),
    })

calurosa = max(ciudades, key=lambda c: c["maxima"])
fria = min(ciudades, key=lambda c: c["minima"])
lluviosas = [c["ciudad"] for c in ciudades if c["lluvia"] >= 70]
print(f"Más calurosa: {calurosa['ciudad']} ({calurosa['maxima']} °C)")
print(f"Más fría: {fria['ciudad']} ({fria['minima']} °C)")
print("Lluvia de 70 % o más:", ", ".join(lluviosas))
