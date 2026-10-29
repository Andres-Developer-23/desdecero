---
title: Selectores CSS
minutes: 20
summary: "select y select_one: buscar con la misma sintaxis que usan las hojas de estilo."
web: https://libreria.example/
---

Hay otra forma de buscar, a menudo más corta: los **selectores CSS**, el mismo lenguaje que usan las hojas de estilo para decir a qué elementos se aplica un estilo.

- `select("selector")` devuelve una lista con todos los elementos que coinciden.
- `select_one("selector")` devuelve el primero, o `None`.

Los selectores más útiles:

- `p`: todas las etiquetas `<p>`.
- `.precio`: los elementos con la clase `precio`.
- `#pronostico`: el elemento con `id="pronostico"`.
- `p.precio`: los `<p>` con la clase `precio`.
- `article h3`: los `<h3>` que están **dentro** de un `<article>`, a cualquier profundidad.
- `ul > li`: los `<li>` que son hijos **directos** de un `<ul>`.
- `a[href]`: los enlaces que tienen el atributo `href`.
- `a[href^="https"]`: los enlaces cuyo `href` **empieza** por `https`.

```py
import requests
from bs4 import BeautifulSoup

sopa = BeautifulSoup(requests.get("https://libreria.example/").text, "html.parser")

print(sopa.select_one("h1").get_text())
print(sopa.select_one("p.resultados").get_text())
print([p.get_text() for p in sopa.select("article.libro p.precio")])
print(sopa.select_one(".paginacion .siguiente a")["href"])
print(len(sopa.select("ol.catalogo > li")))
```

Como con `find`, se puede usar `select` y `select_one` dentro de un resultado para buscar solo ahí:

```py
import requests
from bs4 import BeautifulSoup

sopa = BeautifulSoup(requests.get("https://libreria.example/").text, "html.parser")

for libro in sopa.select("article.libro"):
    autor = libro.select_one(".libro__autor").get_text()
    estrellas = libro.select_one(".estrellas")["aria-label"]
    print(autor, "·", estrellas)
```

¿`find` o `select`? Hacen lo mismo y puedes mezclarlos. `select` es más cómodo para rutas largas («el enlace dentro del título dentro de cada libro») y `find` para condiciones que no se pueden escribir en CSS, como buscar por el texto. Un truco: en el navegador, clic derecho sobre un elemento, **Inspeccionar**, y otra vez clic derecho sobre la etiqueta → **Copiar → Copiar selector**. Suele dar selectores larguísimos que conviene simplificar, pero es un buen punto de partida.

## Ejercicio

Usa **selectores CSS** (`select` y `select_one`) para mostrar, de cada libro de `https://libreria.example/`, su título completo (atributo `title` del enlace del título), su precio y su disponibilidad, con este formato:

```txt
El faro de la niebla | $ 45.900 | En stock
...
```

## Pista

Recorre sopa.select("article.libro"). Dentro de cada libro: libro.select_one(".libro__titulo a")["title"], libro.select_one(".precio").get_text() y lo mismo con ".disponibilidad".
