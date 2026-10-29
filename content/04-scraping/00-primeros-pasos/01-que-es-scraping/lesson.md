---
title: Qué es el web scraping
minutes: 10
summary: Cómo funciona una web por dentro y cómo pedir una página con requests.
web: https://libreria.example/
---

Hacer **web scraping** es escribir un programa que lee páginas web y saca de ellas los datos que te interesan: los precios de una tienda, los titulares de un periódico, una tabla con el clima. Lo que harías copiando y pegando a mano, pero automático, rápido y sin errores.

Para entenderlo hay que saber qué pasa cuando abres una web:

1. El navegador envía una **petición** (*request*) a una dirección, la **URL**: `https://libreria.example/`.
2. El **servidor** de ese sitio contesta con una **respuesta**: un **código de estado** que dice si todo fue bien y el contenido de la página, escrito en **HTML**.
3. El navegador dibuja ese HTML. Tu programa, en cambio, lo lee como texto y busca en él lo que necesita.

Los códigos de estado más habituales son `200` (todo bien), `404` (la página no existe), `403` (no tienes permiso) y `500` (el servidor tuvo un problema).

En Python, las peticiones se hacen con la librería **requests**:

```py
import requests

respuesta = requests.get("https://libreria.example/")
print(respuesta.status_code)
print(respuesta.headers["Content-Type"])
print(respuesta.text[:120])
```

- `requests.get(url)` pide la página y devuelve la respuesta.
- `respuesta.status_code` es el código de estado.
- `respuesta.headers` son las **cabeceras**: datos sobre la respuesta, como el tipo de contenido.
- `respuesta.text` es el HTML completo, como texto. Aquí se muestran solo sus primeros 120 caracteres.

Si la página no existe, el servidor responde igualmente, pero con un `404`:

```py
import requests

respuesta = requests.get("https://libreria.example/no-existe.html")
print(respuesta.status_code, respuesta.reason)
print(respuesta.ok)
```

`respuesta.ok` vale `True` cuando el código es menor que 400, es decir, cuando no hubo error.

### La web de prácticas

Desde esta página no se puede visitar una web real, así que la ruta usa cuatro **sitios de práctica** inventados: [libreria.example](https://libreria.example/), [refranes.example](https://refranes.example/), [clima.example](https://clima.example/) y [noticias.example](https://noticias.example/). Se comportan como sitios de verdad, con sus páginas, sus enlaces y sus errores. Pulsa los enlaces y míralos en la pestaña **web**, junto al editor. Esa pestaña también enseña las páginas que pide tu programa cada vez que lo ejecutas.

En tu ordenador, requests se instala con `pip install requests` y funciona con cualquier web. Eso sí, antes de hacer scraping de un sitio real hay que mirar sus normas. Lo verás en el módulo 3.

## Ejercicio

Descarga la portada de `https://noticias.example/` y muestra, cada dato en su línea:

1. El código de estado.
2. El tipo de contenido (la cabecera `Content-Type`).
3. Cuántos caracteres tiene el HTML.

## Pista

Guarda la respuesta en una variable. El número de caracteres es len(respuesta.text).
