---
title: Buscar con find y find_all
minutes: 20
summary: Encontrar etiquetas por nombre, clase o atributo, y buscar dentro de cada resultado.
web: https://noticias.example/
---

`sopa.h1` solo da la primera etiqueta de cada tipo. Para buscar con más precisión, BeautifulSoup tiene dos métodos:

- `find(...)` devuelve el **primer** elemento que cumple las condiciones, o `None` si no hay ninguno.
- `find_all(...)` devuelve una **lista** con todos los que las cumplen (vacía si no hay ninguno).

Los dos aceptan las mismas condiciones:

```py
import requests
from bs4 import BeautifulSoup

sopa = BeautifulSoup(requests.get("https://noticias.example/").text, "html.parser")

print(sopa.find("h1").get_text())
titulares = sopa.find_all("h2")
print(len(titulares), "titulares")
for titular in titulares:
    print("-", titular.get_text())
```

Buscar solo por el nombre de la etiqueta suele ser demasiado amplio. Lo habitual es añadir la **clase**, con `class_` (con guion bajo, porque `class` es una palabra reservada de Python), o cualquier otro atributo:

```py
import requests
from bs4 import BeautifulSoup

sopa = BeautifulSoup(requests.get("https://noticias.example/").text, "html.parser")

print(sopa.find("span", class_="autor").get_text())
print(len(sopa.find_all("article", class_="noticia")), "noticias")
print(sopa.find("time", datetime="2026-10-23").get_text())
print(sopa.find_all("span", class_="seccion", limit=2))
```

`limit` corta la búsqueda cuando ya tiene suficientes resultados.

La parte más útil: **se puede buscar dentro de un resultado**. `find` y `find_all` existen en cualquier etiqueta, no solo en la sopa, y entonces buscan solo dentro de ella. Así se recorre una lista de elementos parecidos (noticias, productos, filas) y se saca de cada uno lo que interesa:

```py
import requests
from bs4 import BeautifulSoup

sopa = BeautifulSoup(requests.get("https://noticias.example/").text, "html.parser")

for noticia in sopa.find_all("article", class_="noticia"):
    titulo = noticia.find("h2").get_text()
    autor = noticia.find("span", class_="autor").get_text()
    print(f"{titulo} ({autor})")
```

Si `find` no encuentra nada, devuelve `None`, y `None.get_text()` da el error `'NoneType' object has no attribute 'get_text'`. Cuando veas ese error, revisa en la pestaña **web** que la etiqueta y la clase existan tal como las escribiste. Si un elemento puede faltar, compruébalo antes de usarlo:

```py
from bs4 import BeautifulSoup

sopa = BeautifulSoup('<p class="precio">10</p>', "html.parser")
oferta = sopa.find("p", class_="oferta")
if oferta is None:
    print("Sin oferta")
else:
    print(oferta.get_text())
```

## Ejercicio

En la portada de `https://noticias.example/`, cada noticia es un `<article class="noticia">` con su sección en un `<span class="seccion">` y su titular en un `<h2>`.

Muestra cada noticia con el formato `[Sección] Titular`, en el orden de la página, y al final una línea con el total:

```txt
[Cultura] La biblioteca municipal abrirá también de noche
...
6 noticias
```

## Pista

Recorre sopa.find_all("article", class_="noticia") con un for y, dentro, usa noticia.find(...) para la sección y el titular. Para el total, len() de la lista.
