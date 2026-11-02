---
title: Boletín de noticias
level: principiante
tags: [Scraping, JSON]
minutes: 60
runtime: web
requires: scraping
file: boletin.py
web: https://noticias.example/
summary: "Un scraper que recorre las noticias de un periódico, saca los datos de cada una y prepara un boletín por secciones."
---

Vas a construir un **scraper** que prepara un boletín con las noticias de *La Gaceta de Ejemplo*, el periódico de práctica del curso (ábrelo en la pestaña **web**). El programa visita la portada, entra en cada noticia, saca sus datos y cuenta sus palabras, guarda todo en un archivo JSON y escribe en pantalla un boletín ordenado por secciones.

Es un scraper de principio a fin, pequeño pero completo: **recorrer** varias páginas, **extraer** datos de cada una, **guardarlos** en un formato que otro programa pueda leer y hacerlo todo **con buenos modales**.

### Requisitos

- Antes de pedir ninguna página, lee el `robots.txt` del periódico con `RobotFileParser`, y no pidas ninguna página que no permita.
- Descarga la portada y saca la dirección completa de cada noticia (los enlaces de la portada son relativos).
- Visita cada noticia y saca su título (el `<h1>`), su sección, su fecha (el atributo `datetime` de `<time>`), su autor y el número de palabras de su texto: la entradilla y los párrafos, sin la línea de la fecha y el autor.
- Guarda la lista de noticias en `boletin.json`, en el orden de la portada, con las claves `titulo`, `seccion`, `fecha`, `autor`, `palabras` y `url`.
- Escribe el boletín: las secciones en orden alfabético, cada una con sus noticias; y al final, las palabras en total y la noticia más larga.

### Ejemplo

```txt
Boletín de La Gaceta de Ejemplo · 6 noticias

Barrio (1)
  2026-10-24 · El parque central estrena huerta comunitaria · Redacción · 35 palabras

Cultura (3)
  2026-10-26 · La biblioteca municipal abrirá también de noche · Redacción · 48 palabras
  ...

Palabras en total: 244
La más larga: La biblioteca municipal abrirá también de noche (48 palabras)
```

### Restricciones

- Cada petición lleva la cabecera `User-Agent` con el nombre de tu bot (por ejemplo, `BoletinBot/1.0`) y un `timeout`.
- Espera al menos **1 segundo** después de cada petición, con `time.sleep(1)`.
- Pide cada página una sola vez.

### Cómo empezar

Abre la portada y una noticia en la pestaña **web** y mira su HTML: en la portada, cada noticia es un `<article class="noticia">` con el enlace dentro de su `<h2>`; en cada página de noticia, los datos están dentro de `<article class="articulo">`.

`urljoin` (de `urllib.parse`) convierte un enlace relativo en una dirección completa: `urljoin("https://noticias.example/", "2026/10/26/la-biblioteca.html")`. Y para contar palabras, junta los textos y sepáralos por los espacios: `len(texto.split())`.

Para no olvidar la pausa ni la cabecera en ninguna petición, haz todas las peticiones con una misma función:

```py
def descargar(url):
    """La página como sopa, o None si robots.txt no la permite o no responde con 200."""
```

Para agrupar por secciones, un diccionario de listas: `secciones.setdefault(seccion, []).append(noticia)` crea la lista de la sección la primera vez y añade la noticia.

### Para ir más allá

Guarda también el boletín en un archivo Markdown (`boletin.md`) con un enlace a cada noticia, añade el tiempo de lectura de cada una o compara dos ejecuciones para enseñar solo las noticias nuevas. En tu ordenador, con un periódico de verdad, lee antes sus condiciones de uso.

## Objetivo

Escribe `boletin.py`. Las comprobaciones lo ejecutan una vez y revisan:

- que la salida sea el boletín completo, con este formato exacto: la línea `Boletín de La Gaceta de Ejemplo · 6 noticias`; cada sección como `Cultura (3)`, precedida de una línea en blanco; cada noticia como `  2026-10-26 · Título · Autor · 48 palabras` (con dos espacios delante), en el orden de la portada; y al final, tras una línea en blanco, `Palabras en total: …` y `La más larga: … (48 palabras)`;
- que leas primero `robots.txt`, que pidas la portada y las 6 noticias una sola vez, con tu `User-Agent` y al menos un segundo entre petición y petición;
- que `boletin.json` tenga las 6 noticias, en el orden de la portada, con sus claves.

## Pista

Las palabras de cada noticia salen de los `<p>` de su artículo, sin el que tiene la clase `meta`. `p.get("class", [])` da la lista de clases de una etiqueta (vacía si no tiene):

```py
parrafos = [p.get_text() for p in articulo.find_all("p") if "meta" not in p.get("class", [])]
palabras = len(" ".join(parrafos).split())
```

`max(noticias, key=lambda noticia: noticia["palabras"])` da la noticia con más palabras. Y `sorted(secciones)` da los nombres de las secciones en orden alfabético.

## Solución

La solución de referencia separa el trabajo en tres funciones: `descargar` (robots, cabeceras, pausa y comprobación de la respuesta), `enlaces_de_portada` y `leer_noticia`, que devuelve un diccionario con los datos de una noticia. El programa principal solo las combina: recorre los enlaces, guarda el JSON y escribe el boletín.

Como `descargar` devuelve `None` cuando no puede descargar una página, `leer_noticia` también devuelve `None` y el bucle principal se salta esa noticia: si un día una noticia da error 404, el boletín sale igual con las demás.
