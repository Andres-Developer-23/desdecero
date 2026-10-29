---
title: Seguir enlaces
minutes: 25
summary: URL relativas, urljoin y cómo visitar la página de cada elemento de una lista.
web: https://libreria.example/
---

Las listas casi nunca tienen todos los datos. El catálogo de la librería muestra título y precio, pero el número de ejemplares, la categoría o la sinopsis están en la **página de cada libro**. Para conseguirlos, el scraper tiene que hacer lo mismo que una persona: seguir cada enlace.

El problema es que los enlaces suelen ser **relativos**: `libro/el-faro-de-la-niebla.html` no es una dirección completa, sino una ruta que se completa con la dirección de la página donde está el enlace. El navegador lo hace solo; tu programa tiene que hacerlo con `urljoin`, del módulo `urllib.parse`:

```py
from urllib.parse import urljoin

pagina = "https://libreria.example/catalogo/pagina-2.html"
print(urljoin(pagina, "pagina-3.html"))
print(urljoin(pagina, "../libro/el-faro-de-la-niebla.html"))
print(urljoin(pagina, "/contacto.html"))
print(urljoin(pagina, "https://refranes.example/"))
```

- Una ruta sin barra inicial se une a la **carpeta** de la página actual.
- `../` sube una carpeta.
- Una ruta que empieza por `/` parte de la **raíz** del sitio.
- Una URL completa se queda como está.

Con eso, seguir enlaces es un bucle que en cada vuelta hace una petición más. Conviene escribir una pequeña función que descargue y analice, porque se usa en cada vuelta:

```py
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def descargar(url):
    respuesta = requests.get(url)
    return BeautifulSoup(respuesta.text, "html.parser")

portada = "https://noticias.example/"
sopa = descargar(portada)
for enlace in sopa.select("article.noticia h2 a")[:3]:
    url = urljoin(portada, enlace["href"])
    articulo = descargar(url)
    print(articulo.h1.get_text())
    print("  ", articulo.find("p", class_="entradilla").get_text())
```

Ejecuta el ejemplo y mira la pestaña **web**: una petición para la portada y otra por cada artículo. Cada petición tarda y le cuesta trabajo al servidor, así que el número de páginas que visita tu programa importa. En la próxima lección verás cómo recorrer un sitio entero, y en la siguiente, cómo hacerlo sin abusar.

## Ejercicio

Para cada libro de `https://libreria.example/`, abre su página y muestra cuántos ejemplares quedan. En la página de cada libro, la disponibilidad dice `En stock (7 disponibles)` o `Agotado`.

```txt
El faro de la niebla: 7
Python para curiosos: 12
Cartas desde el páramo: 0
...
```

Usa el título completo (el `<h1>` de la página del libro) y muestra `0` si está agotado.

## Pista

Saca el href de cada título y conviértelo en dirección completa con urljoin("https://libreria.example/", href). En la página del libro, busca el <p> con la clase disponibilidad: si su texto empieza por "En stock", quédate solo con los dígitos.
