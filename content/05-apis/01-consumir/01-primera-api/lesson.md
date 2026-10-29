---
title: Tu primera API
minutes: 12
summary: Qué es una API web, cómo se explora y cómo pedirle datos con requests y .json().
web: https://api.libreria.example/
---

Una **API web** es una puerta para que los programas hablen con un servicio. Funciona como una web, con URLs y peticiones, pero en lugar de páginas HTML pensadas para personas responde **datos**, casi siempre en JSON, pensados para programas. Así es como una app del tiempo consigue el pronóstico, o una tienda online consulta el precio del envío.

Si vienes de la ruta de web scraping, la diferencia es enorme: no hay que buscar los datos dentro del HTML, porque la API ya los da ordenados.

### Rutas y recursos

Cada API tiene una dirección base y varias **rutas** (también llamadas *endpoints*), una para cada tipo de dato o **recurso**. La API de la librería del curso es así:

- `https://api.libreria.example/v1/libros`: la lista de libros;
- `https://api.libreria.example/v1/libros/2`: el libro con id 2;
- `https://api.libreria.example/v1/categorias`: las categorías.

El `v1` es la **versión** de la API: si un día cambia mucho, sus creadores publican una `v2` sin romper los programas que usan la `v1`.

Muchas APIs explican sus rutas en su dirección base. Ábrela en la pestaña **web**: [api.libreria.example](https://api.libreria.example/). Explorar así una API antes de programar ahorra muchas pruebas.

### Pedir datos con requests

Se usa `requests.get()`, igual que con una página web. La diferencia está en la respuesta: en lugar de leer `respuesta.text`, se convierte el JSON con `respuesta.json()`, que es lo mismo que `json.loads(respuesta.text)`:

```py
import requests

respuesta = requests.get("https://api.libreria.example/v1/libros/2")
print(respuesta.status_code)
print(respuesta.headers["Content-Type"])

libro = respuesta.json()
print(libro["titulo"], "·", libro["autor"])
print(libro["precio"], libro["moneda"])
print("Páginas:", libro["paginas"])
```

La cabecera `Content-Type: application/json` avisa de que la respuesta es JSON. Después de ejecutar, mira la pestaña **web**: verás la respuesta con formato y colores.

### Cuando algo no existe

Una buena API también contesta en JSON cuando hay un error. Con un id que no existe, responde `404` y explica el problema:

```py
import requests

respuesta = requests.get("https://api.libreria.example/v1/libros/99")
print(respuesta.status_code, respuesta.reason)
print(respuesta.json())
```

Por eso conviene mirar `status_code` (o `respuesta.ok`) antes de usar los datos: si el libro no existe, `respuesta.json()["titulo"]` lanzaría `KeyError`.

Y si la respuesta no es JSON (por ejemplo, una página HTML), `respuesta.json()` lanza `requests.exceptions.JSONDecodeError`:

```py
import requests

try:
    requests.get("https://libreria.example/").json()
except requests.exceptions.JSONDecodeError as error:
    print("No es JSON:", error)
```

## Ejercicio

Pide a la API de la librería sus categorías (`/v1/categorias`). La respuesta es una lista de objetos con `nombre`, `libros` y `url`.

Muestra cada categoría con su número de libros, en el orden en que llegan, y al final el total de libros y de categorías:

```txt
Ciencia ficción: 3
Ensayo: 1
...
Total: 18 libros en 8 categorías
```

No escribas los números a mano: calcúlalos con los datos de la respuesta.

## Pista

respuesta.json() te da una lista: recórrela con for categoria in categorias y usa categoria["nombre"] y categoria["libros"]. Para el total, ve sumando categoria["libros"] en una variable; el número de categorías es len(categorias).
