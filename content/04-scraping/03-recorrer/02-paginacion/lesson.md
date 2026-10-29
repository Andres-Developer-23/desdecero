---
title: Paginación
minutes: 20
summary: Pasar de página siguiendo el enlace «Siguiente» hasta que no haya más.
web: https://refranes.example/
---

Cuando una lista es larga, los sitios la reparten en varias páginas y ponen al final un enlace a la siguiente: es la **paginación**. Para recogerlo todo, el scraper repite el mismo trabajo en cada página y pasa a la siguiente mientras exista.

Se podría escribir la lista de páginas a mano (`/pagina/2/`, `/pagina/3/`...), pero no sabrías cuántas hay ni te enterarías si cambian. Es mucho mejor **seguir el enlace «Siguiente»**, que es lo que hace una persona:

```py
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

url = "https://refranes.example/"
while url:
    sopa = BeautifulSoup(requests.get(url).text, "html.parser")
    print(url, "→", len(sopa.select(".refran")), "refranes")

    siguiente = sopa.select_one("li.siguiente a")
    if siguiente:
        url = urljoin(url, siguiente["href"])
    else:
        url = None
```

Cómo funciona:

- `while url:` repite mientras haya una dirección que visitar (`None` cuenta como falso).
- En cada vuelta se procesa la página y se busca el enlace a la siguiente.
- En la última página no hay enlace, `select_one` devuelve `None` y `url` pasa a valer `None`: el bucle termina.

En sitios reales conviene poner además un **límite de páginas**, por si el enlace «Siguiente» nunca desaparece por un error del sitio:

```py
paginas = 0
url = "https://refranes.example/"
while url and paginas < 50:
    paginas += 1
    url = None  # aquí iría el trabajo de cada página
print(paginas)
```

Lo que recojas en cada página se va acumulando en una lista o un diccionario que se crea **antes** del bucle, igual que hacías con los acumuladores en la ruta de Python.

## Ejercicio

Recorre todas las páginas de `https://refranes.example/` siguiendo el enlace «Siguiente». Cada refrán es un `<div class="refran">` y sus temas son los `<span class="tema">` que tiene dentro.

Cuenta cuántas veces aparece cada tema y muestra:

```txt
Refranes: 20
Páginas: 4
constancia: 4
...
```

Después de las dos primeras líneas, muestra los temas que aparecen **3 veces o más**, en orden alfabético, con el formato `tema: veces`.

## Pista

Crea un diccionario conteo antes del bucle while. En cada refrán, recorre sus span.tema y suma 1 con conteo[tema] = conteo.get(tema, 0) + 1. Al final, recorre sorted(conteo) y muestra solo los que tienen 3 o más.
