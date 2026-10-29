---
title: "Proyecto: el catálogo completo"
minutes: 30
summary: "Un scraper de principio a fin: todas las páginas, la ficha de cada libro, pausas y un CSV."
web: https://libreria.example/
---

Es hora de juntarlo todo en un scraper de verdad: el catálogo completo de la librería, con los datos de la ficha de cada libro, guardado en un CSV. Antes de escribir código, el plan:

1. **Recorrer el catálogo** página a página, siguiendo «Siguiente», y anotar la dirección de la ficha de cada libro.
2. **Visitar cada ficha** y sacar sus datos: título, autor, precio, estrellas, categoría y ejemplares.
3. **Guardar** la lista de libros en `libros.csv`.
4. **Resumir** los datos en pantalla.

Y todo **sin molestar**: el `robots.txt` de la librería pide un segundo entre peticiones (`Crawl-delay: 1`), así que todas pasan por una función `descargar` que espera después de cada una. Cuantas más páginas visita un programa, más importa esa pausa.

Dividir el trabajo en funciones pequeñas hace el programa más fácil de leer y de arreglar. Cada función hace una cosa:

```py
def descargar(url):
    """Pide una página con cabeceras y pausa, y devuelve la sopa."""

def enlaces_del_catalogo():
    """Recorre el catálogo y devuelve las direcciones de todas las fichas."""

def leer_ficha(url):
    """Visita una ficha y devuelve un diccionario con los datos del libro."""

def guardar(libros, nombre):
    """Escribe la lista de libros en un CSV."""
```

En la ficha de cada libro, la categoría está en la tabla **Ficha técnica**: es la celda `<td>` de la fila cuyo `<th>` dice «Categoría». `find` puede buscar por el texto de una etiqueta con `string=`, y `find_next_sibling` da la siguiente etiqueta hermana:

```py
from bs4 import BeautifulSoup

html = "<table><tr><th>Categoría</th><td>Novela</td></tr><tr><th>Año</th><td>2021</td></tr></table>"
sopa = BeautifulSoup(html, "html.parser")
print(sopa.find("th", string="Categoría").find_next_sibling("td").get_text())
```

### Y ahora, en tu ordenador

Todo lo que has aprendido funciona igual fuera del curso. Instala las librerías con `pip install requests beautifulsoup4` y practica en sitios hechos para eso, como `books.toscrape.com` y `quotes.toscrape.com`, que permiten el scraping y se parecen mucho a los de esta ruta.

Algunas webs cargan sus datos con JavaScript después de abrirse, y entonces no aparecen en `respuesta.text`. En esos casos, mira en las herramientas del navegador (pestaña **Red**) si la página pide los datos a una API, o usa herramientas que controlan un navegador de verdad, como Playwright o Selenium. Y en cualquier web real: lee sus condiciones, respeta su `robots.txt` y haz pausas.

## Ejercicio

Termina el scraper de la librería. El código de partida ya tiene `descargar` (con cabeceras y una pausa de 1 segundo) y `a_numero`. Te faltan:

1. `enlaces_del_catalogo()`: recorre todas las páginas del catálogo desde `PORTADA` siguiendo «Siguiente» y devuelve la lista de direcciones **completas** de las fichas, en orden.
2. `leer_ficha(url)`: devuelve un diccionario con `"titulo"` (el `<h1>`), `"autor"`, `"precio"` y `"estrellas"` (números), `"categoria"` (de la ficha técnica) y `"ejemplares"` (0 si está agotado).
3. Guarda todos los libros en `libros.csv` con las columnas `titulo`, `autor`, `precio`, `estrellas`, `categoria` y `ejemplares`, y muestra:

```txt
Libros guardados: 18
Agotados: 3
Precio medio: 50367
Categoría con más libros: Novela (4)
```

El precio medio va redondeado con `round()`.

## Pista

En enlaces_del_catalogo, usa el bucle while de la lección de paginación y, en cada página, urljoin(url, enlace["href"]) para cada título. En leer_ficha, el autor está en span.autor y las estrellas en la clase estrellas-N. Para la categoría más repetida, cuenta con un diccionario y usa max(conteo, key=conteo.get).
