import requests
from bs4 import BeautifulSoup


def a_numero(texto):
    """Convierte "$ 45.900" en 45900."""
    cifras = ""
    for caracter in texto:
        if caracter.isdigit():
            cifras += caracter
    return int(cifras)


def estrellas_de(etiqueta):
    for clase in etiqueta["class"]:
        if clase.startswith("estrellas-"):
            return int(clase.split("-")[1])
    return 0


sopa = BeautifulSoup(requests.get("https://libreria.example/").text, "html.parser")
libros = []
for articulo in sopa.select("article.libro"):
    libros.append({
        "titulo": articulo.select_one(".libro__titulo a")["title"],
        "precio": a_numero(articulo.select_one(".precio").get_text()),
        "estrellas": estrellas_de(articulo.select_one(".estrellas")),
    })

medio = sum(libro["precio"] for libro in libros) / len(libros)
barato = min(libros, key=lambda libro: libro["precio"])
mejor = max(libros, key=lambda libro: libro["estrellas"])
print("Libros:", len(libros))
print("Precio medio:", round(medio))
print(f"Más barato: {barato['titulo']} ({barato['precio']})")
print(f"Mejor valorado: {mejor['titulo']} ({mejor['estrellas']} estrellas)")
