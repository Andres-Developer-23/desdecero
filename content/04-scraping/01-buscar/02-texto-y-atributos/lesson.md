---
title: Texto y atributos
minutes: 20
summary: "get_text, .string y los atributos de una etiqueta: enlaces, títulos y fechas."
web: https://libreria.example/
---

De cada etiqueta interesan dos cosas: su **texto** y sus **atributos**.

El texto se saca con `get_text()`. Con `strip=True` quita los espacios y saltos de línea de los extremos de cada trozo, algo casi siempre necesario porque el HTML está lleno de sangrías. `.string` también da el texto, pero solo si la etiqueta contiene un único texto; si dentro hay varias etiquetas, vale `None`:

```py
from bs4 import BeautifulSoup

html = """
<p class="meta">
  <time datetime="2026-10-26">26 de octubre</time> · <span>Redacción</span>
</p>
"""
meta = BeautifulSoup(html, "html.parser").p

print(repr(meta.get_text()))
print(repr(meta.get_text(strip=True)))
print(meta.get_text(" | ", strip=True))
print(meta.string)
print(meta.time.string)
```

`get_text(" | ", strip=True)` une los trozos de texto con el separador que le pases.

Los **atributos** se leen como en un diccionario:

```py
from bs4 import BeautifulSoup

enlace = BeautifulSoup('<a href="libro/el-faro.html" title="El faro de la niebla" class="titulo destacado">El faro…</a>', "html.parser").a

print(enlace["href"])
print(enlace.get("title"))
print(enlace.get("rel"))
print(enlace["class"])
print(enlace.attrs)
```

- `etiqueta["href"]` da el valor y lanza `KeyError` si el atributo no existe.
- `etiqueta.get("href")` devuelve `None` si no existe: es más seguro cuando no todas las etiquetas lo tienen.
- `class` es especial: una etiqueta puede tener varias clases, así que devuelve una **lista**.

Muchas veces el dato bueno está en un atributo y no en el texto. En el catálogo de la librería, los títulos largos se ven recortados con «…», pero el título completo está en el atributo `title` del enlace. Igual pasa con las fechas, que suelen tener un atributo `datetime` con un formato fácil de procesar:

```py
import requests
from bs4 import BeautifulSoup

sopa = BeautifulSoup(requests.get("https://libreria.example/").text, "html.parser")
for enlace in sopa.find_all("a", title=True):
    print(enlace.get_text(), "→", enlace["title"])
```

`title=True` busca las etiquetas que **tienen** ese atributo, valga lo que valga. Míralo en la pestaña **web**: el texto que se ve no siempre es todo lo que hay.

## Ejercicio

En la primera página de la librería (`https://libreria.example/`), el título de cada libro es un enlace dentro de un `<h3 class="libro__titulo">`. Algunos títulos se ven recortados, pero el completo está en el atributo `title` del enlace.

Muestra cada libro con su título completo y la dirección de su enlace (el atributo `href`), con este formato:

```txt
El faro de la niebla -> libro/el-faro-de-la-niebla.html
...
```

## Pista

Busca los h3 con class_="libro__titulo" y, dentro de cada uno, el enlace con .find("a") o .a. Luego lee enlace["title"] y enlace["href"].
