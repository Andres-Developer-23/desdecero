---
title: HTML para scrapers y BeautifulSoup
minutes: 15
summary: Etiquetas, atributos y el árbol del HTML, y cómo leerlo con BeautifulSoup.
web: https://clima.example/
---

Para sacar datos de una página hay que saber cómo está escrito su HTML. Un documento HTML es texto con **etiquetas**:

```html
<article class="noticia" id="portada">
  <h2><a href="/2026/10/26/biblioteca.html">La biblioteca abrirá de noche</a></h2>
  <p class="meta">26 de octubre · <span class="autor">Redacción</span></p>
</article>
```

- Una **etiqueta** marca un trozo de la página: `<h2>` es un título, `<p>` un párrafo, `<a>` un enlace. Casi todas se abren y se cierran: `<p>...</p>`.
- Las etiquetas pueden tener **atributos** dentro de la apertura: `href` es la dirección de un enlace, `class` agrupa elementos parecidos y `id` identifica uno solo.
- Las etiquetas van unas **dentro de otras**. El `<a>` está dentro del `<h2>`, que está dentro del `<article>`. Por eso se habla del **árbol** del HTML, con padres e hijos.

Para ver el HTML de una página, abre la pestaña **web** y pulsa **código**. En un navegador normal, haz clic derecho sobre cualquier parte de la página y elige **Inspeccionar**: verás la etiqueta exacta de lo que señalaste. Es lo primero que se hace antes de escribir un scraper.

Leer ese HTML con métodos de texto (`find`, `split`...) sería un infierno. Para eso está **BeautifulSoup**, que convierte el HTML en un árbol de objetos de Python que se puede recorrer:

```py
from bs4 import BeautifulSoup

html = """
<html>
  <head><title>Mi página</title></head>
  <body>
    <h1>Hola</h1>
    <p>Primer párrafo.</p>
    <p>Segundo párrafo.</p>
  </body>
</html>
"""

sopa = BeautifulSoup(html, "html.parser")
print(sopa.title)
print(sopa.title.string)
print(sopa.h1.get_text())
print(sopa.p.get_text())
```

- `BeautifulSoup(html, "html.parser")` analiza el HTML. `"html.parser"` es el analizador que trae Python; existen otros, como `lxml`, más rápidos pero que hay que instalar.
- `sopa.title` es la **primera** etiqueta `<title>` del documento, con sus marcas. `sopa.p` es el primer párrafo, aunque haya más.
- `.string` y `.get_text()` dan solo el texto de dentro, sin etiquetas.

Lo normal es combinar las dos librerías: requests descarga la página y BeautifulSoup la analiza:

```py
import requests
from bs4 import BeautifulSoup

respuesta = requests.get("https://libreria.example/contacto.html")
sopa = BeautifulSoup(respuesta.text, "html.parser")
print(sopa.title.string)
print(sopa.h1.get_text())
```

En tu ordenador, BeautifulSoup se instala con `pip install beautifulsoup4` y se importa como `bs4`.

## Ejercicio

Descarga `https://clima.example/` y muestra, cada uno en su línea:

1. El texto de la etiqueta `<title>`.
2. El texto del encabezado `<h1>`.
3. El texto del **primer** párrafo `<p>` de la página.

## Pista

Analiza respuesta.text con BeautifulSoup(..., "html.parser"). sopa.p es el primer párrafo de la página.
