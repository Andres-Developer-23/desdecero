---
title: Paginación
minutes: 15
summary: Recorre todas las páginas de resultados siguiendo los enlaces que da la API.
web: https://api.libreria.example/v1/libros
---

Si una API tiene miles de resultados, no los manda todos en una respuesta: los reparte en **páginas**. La de la librería da 5 libros por página si no le dices otra cosa, y como mucho 10.

Fíjate en lo que acompaña a los resultados:

```py
import requests

datos = requests.get("https://api.libreria.example/v1/libros", params={"por_pagina": 4}).json()
print("total:", datos["total"])
print("pagina:", datos["pagina"], "de", datos["paginas"])
print("siguiente:", datos["siguiente"])
print("anterior:", datos["anterior"])
print("en esta página:", len(datos["resultados"]))
```

- `total` es el número de resultados entre todas las páginas;
- `pagina` y `paginas` dicen dónde estás;
- `siguiente` y `anterior` son las URL de las páginas vecinas, o `None` si no hay.

### Seguir el enlace «siguiente»

La forma más segura de recorrerlas es la misma que en el scraping: seguir el enlace a la siguiente página mientras exista. Así no tienes que calcular nada, y si la API cambia cómo numera sus páginas, tu programa sigue funcionando:

```py
import requests

url = "https://api.libreria.example/v1/libros?por_pagina=10&orden=titulo"
titulos = []
while url:
    datos = requests.get(url).json()
    for libro in datos["resultados"]:
        titulos.append(libro["titulo"])
    url = datos["siguiente"]

print(len(titulos), "libros")
print("Primero:", titulos[0])
print("Último:", titulos[-1])
```

El enlace `siguiente` ya incluye los parámetros de la primera petición (`por_pagina`, `orden` y los filtros), así que **no hace falta volver a pasarlos**.

### Cuántas peticiones hacer

Cada página es una petición. Pedir páginas grandes (`por_pagina=10`) reduce las peticiones, y eso es más rápido para ti y más amable con el servidor. En la pestaña **web** puedes ver cuántas hizo tu programa.

Si una API no da enlaces, se puede recorrer con un contador: pedir `pagina=1`, `pagina=2`... hasta llegar a `datos["paginas"]`.

## Ejercicio

Recorre **todas** las páginas de `https://api.libreria.example/v1/libros` con **5 libros por página**, siguiendo el enlace `siguiente` con un bucle `while`.

Con los libros de todas las páginas, muestra cuántas páginas pediste, cuántos libros hay, la valoración media (redondeada a 1 decimal) y los títulos de los libros que no están disponibles, en el orden en que llegan, separados por comas:

```txt
Páginas: 4
Libros: 18
Valoración media: 3.7
Agotados: Cartas desde el páramo, ...
```

## Pista

Empieza con url = "https://api.libreria.example/v1/libros?por_pagina=5" y un contador de páginas a 0. Dentro del while, suma 1 al contador, añade cada libro a una lista y termina con url = datos["siguiente"]. Para los agotados, quédate con los libros cuyo libro["disponible"] es False y únelos con ", ".join(...).
