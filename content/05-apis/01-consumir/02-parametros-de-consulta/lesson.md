---
title: Parámetros de consulta
minutes: 15
summary: Filtra y ordena los resultados con params= y pide un recurso concreto por su id.
web: https://api.libreria.example/v1/libros?categoria=Novela
---

Casi ninguna API te devuelve todo de golpe: le dices qué quieres con **parámetros**. Hay dos formas de pasarlos.

### Parámetros en la ruta

El id de un recurso forma parte de la ruta: `/v1/libros/2`. Se construye la URL con una f-string:

```py
import requests

for id_libro in [4, 10]:
    libro = requests.get(f"https://api.libreria.example/v1/libros/{id_libro}").json()
    print(id_libro, libro["titulo"], "·", libro["editorial"])
```

### Parámetros de consulta

Los filtros van al final de la URL, después de un `?`, como pares `clave=valor` separados por `&`. Es la **cadena de consulta** (*query string*):

```txt
https://api.libreria.example/v1/libros?categoria=Novela&orden=-precio
```

Escribirla a mano es incómodo y fácil de romper: los espacios, las tildes y algunos símbolos se tienen que **codificar** (`ficción` se escribe `ficci%C3%B3n`). Mejor pásale un diccionario a `params=` y requests construye la URL por ti:

```py
import requests

filtros = {"categoria": "Ciencia ficción", "orden": "-valoracion"}
respuesta = requests.get("https://api.libreria.example/v1/libros", params=filtros)

print(respuesta.url)
datos = respuesta.json()
print("Encontrados:", datos["total"])
for libro in datos["resultados"]:
    print(libro["valoracion"], libro["titulo"])
```

`respuesta.url` es la URL que se pidió de verdad, con los parámetros ya codificados.

### Qué parámetros admite una API

Cada API decide sus parámetros y los explica en su documentación. Los de `/v1/libros` están en la dirección base, [api.libreria.example](https://api.libreria.example/):

- `categoria`: solo los libros de esa categoría;
- `autor`: libros cuyo autor contiene ese texto;
- `q`: busca en el título y el autor;
- `disponible`: `true` para ver solo los que tienen existencias;
- `precio_max`: precio máximo;
- `orden`: `titulo`, `autor`, `precio`, `valoracion` o `publicado`, con un `-` delante para ordenar de mayor a menor.

La respuesta de `/v1/libros` no es una lista, sino un objeto: `total` dice cuántos libros cumplen los filtros y `resultados` trae la lista. Cada libro de la lista es un **resumen**; los datos completos están en su `url`.

Si un parámetro no tiene un valor válido, la API responde `400 Bad Request` y explica qué falla:

```py
import requests

respuesta = requests.get("https://api.libreria.example/v1/libros", params={"orden": "color"})
print(respuesta.status_code, respuesta.json())
```

## Ejercicio

Busca en la API de la librería los libros **disponibles** que cuestan **50000 pesos o menos**, ordenados de **más barato a más caro**, con hasta 10 resultados por página (`por_pagina`). Usa `params=`.

Muestra cuántos hay y cada uno con su precio. Después, pide los datos completos del **más barato** (el primero) usando su `id`, y muestra su editorial y sus páginas:

```txt
Encontrados: 9
28500 · Versos para un lunes
29900 · Un dragón en la biblioteca
...
El más barato: Versos para un lunes (La Hoja Suelta, 96 páginas)
```

## Pista

Los parámetros son {"disponible": "true", "precio_max": 50000, "orden": "precio", "por_pagina": 10}. El más barato es datos["resultados"][0]; con su ["id"] construye la URL f"https://api.libreria.example/v1/libros/{id}" y pide sus datos completos.
