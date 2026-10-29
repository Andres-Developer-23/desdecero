---
title: De texto a números
minutes: 20
summary: Limpiar precios, extraer valoraciones y guardar cada elemento como un diccionario.
web: https://libreria.example/
---

Todo lo que sale de una página es **texto**: `"$ 45.900"` no es un número, y no se puede sumar ni comparar como tal. Antes de analizar los datos hay que limpiarlos.

Para convertir un precio hay que quitar todo lo que no son cifras. Con los métodos de texto que ya conoces:

```py
texto = " $ 45.900 "
limpio = texto.strip().replace("$", "").replace(".", "").strip()
precio = int(limpio)
print(precio, precio * 2)
```

Como lo vas a hacer muchas veces, lo mejor es escribirlo una vez en una función:

```py
def a_numero(texto):
    """Convierte "$ 45.900" en 45900."""
    cifras = ""
    for caracter in texto:
        if caracter.isdigit():
            cifras += caracter
    return int(cifras)

print(a_numero("$ 45.900"), a_numero("19 °C"), a_numero("70 %"))
```

A veces el dato está en una clase o un atributo. En la librería, la valoración está en la clase `estrellas-4`, y se saca partiendo el texto:

```py
from bs4 import BeautifulSoup

p = BeautifulSoup('<p class="estrellas estrellas-4">★★★★☆</p>', "html.parser").p
for clase in p["class"]:
    if clase.startswith("estrellas-"):
        print(int(clase.split("-")[1]))
```

Con los datos limpios, lo natural es guardar cada elemento como un **diccionario** y todos juntos en una **lista**. A partir de ahí es Python de siempre:

```py
import requests
from bs4 import BeautifulSoup

def a_numero(texto):
    return int("".join(c for c in texto if c.isdigit()))

sopa = BeautifulSoup(requests.get("https://libreria.example/").text, "html.parser")
libros = []
for articulo in sopa.select("article.libro"):
    libros.append({
        "titulo": articulo.select_one(".libro__titulo a")["title"],
        "precio": a_numero(articulo.select_one(".precio").get_text()),
    })

print(libros[0])
total = sum(libro["precio"] for libro in libros)
print("Total:", total)
caro = max(libros, key=lambda libro: libro["precio"])
print("Más caro:", caro["titulo"])
```

`max(lista, key=...)` devuelve el elemento con el mayor valor según la función que le pases; `min` hace lo contrario. Si hay empate, devuelven el **primero**. La expresión `lambda libro: libro["precio"]` es una función de una línea: recibe un libro y devuelve su precio.

## Ejercicio

Con los libros de `https://libreria.example/`, crea una lista llamada `libros` con un diccionario por libro, con estas claves:

- `"titulo"`: el título completo (atributo `title` del enlace).
- `"precio"`: el precio como número entero (`45900`).
- `"estrellas"`: la valoración como número entero (sale de la clase `estrellas-4`).

Después muestra:

```txt
Libros: 6
Precio medio: 49333
Más barato: Versos para un lunes (28500)
Mejor valorado: Python para curiosos (5 estrellas)
```

El precio medio va redondeado con `round()`. Si hay empate en las estrellas, vale el primero de la página.

## Pista

Escribe una función a_numero(texto) que se quede solo con los dígitos. Para las estrellas, recorre articulo.select_one(".estrellas")["class"] y busca la clase que empieza por "estrellas-". Luego usa min() y max() con key=.
