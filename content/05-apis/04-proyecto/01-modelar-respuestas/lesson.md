---
title: Modelar respuestas con clases
minutes: 16
summary: Convierte el JSON de una API en objetos con @dataclass y un constructor desde_json().
web: https://api.libreria.example/v1/libros
---

Trabajar todo el rato con diccionarios tiene sus problemas: si escribes `libro["titlo"]` el error solo aparece al ejecutar, el editor no te sugiere las claves y no hay dónde poner la lógica que va con los datos. En programas medianos conviene convertir las respuestas en **objetos**.

### Una clase para cada recurso

Una `@dataclass` (lo viste en la ruta de programación orientada a objetos) es perfecta: declara los campos y Python escribe el `__init__`, el `__repr__` y el `__eq__`. Le añadimos un **constructor alternativo** con `@classmethod`, que sabe crear el objeto a partir del JSON:

```py
from dataclasses import dataclass

import requests


@dataclass
class Libro:
    id: int
    titulo: str
    autor: str
    precio: int

    @classmethod
    def desde_json(cls, datos):
        """Crea un Libro a partir de un diccionario de la API."""
        return cls(id=datos["id"], titulo=datos["titulo"], autor=datos["autor"], precio=datos["precio"])

    def precio_con_descuento(self, porcentaje):
        return self.precio * (100 - porcentaje) // 100


datos = requests.get("https://api.libreria.example/v1/libros/7").json()
libro = Libro.desde_json(datos)
print(libro)
print(libro.titulo, "→", libro.precio_con_descuento(20))
```

- `desde_json()` toma **solo los campos que te interesan**: si la API añade campos nuevos, tu programa sigue funcionando.
- Si a la API le falta un campo obligatorio, el error salta en un único sitio, al crear el objeto, y no en mitad del programa.
- La lógica que va con los datos, como calcular un descuento, vive en la clase.

### Propiedades calculadas

Con `@property` se añaden datos que se calculan a partir de otros, y se usan como un atributo más:

```py
from dataclasses import dataclass


@dataclass
class Libro:
    titulo: str
    valoracion: int
    disponible: bool

    @property
    def estrellas(self):
        return "★" * self.valoracion + "☆" * (5 - self.valoracion)


print(Libro("La última estación", 5, True).estrellas)
print(Libro("Versos para un lunes", 2, True).estrellas)
```

### De vuelta a JSON

Para guardar objetos en JSON, `dataclasses.asdict()` los convierte de nuevo en diccionarios:

```py
import json
from dataclasses import asdict, dataclass


@dataclass
class Ciudad:
    nombre: str
    temperatura: int


ciudades = [Ciudad("Cali", 26), Ciudad("Pasto", 14)]
print(json.dumps([asdict(ciudad) for ciudad in ciudades], ensure_ascii=False))
```

## Ejercicio

Completa la clase `Libro`:

- `desde_json(cls, datos)`: crea un `Libro` con los campos `id`, `titulo`, `autor`, `precio`, `valoracion` y `disponible` de un resultado de la API.
- La propiedad `destacado`: `True` si el libro tiene valoración 5 **y** está disponible.
- El método `etiqueta()`: devuelve `"<titulo> — <autor> (<precio>)"`.

Después, recorre todas las páginas de `/v1/libros` con 10 libros por página, convierte cada resultado en un `Libro`, y muestra cuántos hay y la etiqueta de los destacados. Guarda los destacados en `destacados.json` con `asdict()`:

```txt
Libros: 18
Destacados:
- Python para curiosos — Andrés Quintero (68500)
...
```

## Pista

desde_json devuelve cls(id=datos["id"], titulo=datos["titulo"], ...). La propiedad es return self.valoracion == 5 and self.disponible. Para recorrer las páginas, reutiliza el while con datos["siguiente"] de la lección de paginación y añade Libro.desde_json(resultado) a la lista. Al guardar: json.dump([asdict(libro) for libro in destacados], archivo, ensure_ascii=False).
