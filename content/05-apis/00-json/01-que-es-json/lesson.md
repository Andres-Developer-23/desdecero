---
title: Qué es JSON
minutes: 12
summary: El formato de texto con el que hablan las APIs, y cómo convertirlo en datos de Python y al revés.
---

Cuando un programa le pide datos a otro por internet, necesitan un idioma común para escribirlos. El más usado es **JSON** (*JavaScript Object Notation*): un formato de **texto** que se parece mucho a los diccionarios y las listas de Python.

```txt
{
  "titulo": "Python para curiosos",
  "precio": 68500,
  "disponible": true,
  "etiquetas": ["programación", "principiantes"],
  "descuento": null
}
```

### De JSON a Python

Cada tipo de JSON tiene su equivalente en Python:

- un **objeto** `{ }` es un `dict`;
- un **array** `[ ]` es una `list`;
- un texto `"..."` es un `str`;
- un número es un `int` (`68500`) o un `float` (`12.5`);
- `true` y `false` son `True` y `False`;
- `null` es `None`.

El módulo `json` hace la conversión. `json.loads()` (*load string*) recibe un texto y devuelve los datos de Python:

```py
import json

texto = '{"titulo": "Python para curiosos", "precio": 68500, "disponible": true, "descuento": null}'
libro = json.loads(texto)

print(type(texto), type(libro))
print(libro["titulo"])
print(libro["disponible"], libro["descuento"])
print(libro["precio"] * 2)
```

Mientras es texto, `texto["titulo"]` no tiene sentido: hay que convertirlo antes con `json.loads()`.

### Las reglas de JSON

JSON es más estricto que Python:

- los textos y las claves van siempre entre **comillas dobles**: `'titulo'` no vale;
- las claves de un objeto son siempre textos;
- no se admiten comas al final (`[1, 2,]`) ni comentarios.

### De Python a JSON

`json.dumps()` (*dump string*) hace el camino contrario: convierte datos de Python en un texto JSON. Fíjate en cómo cambian `True`, `None`, la tupla y la clave numérica:

```py
import json

datos = {"nombre": "Ana", "activa": True, "telefono": None, "notas": (8, 9.5), 2026: "año"}
print(json.dumps(datos))
```

Dos opciones hacen el texto más fácil de leer:

- `indent=2` lo reparte en varias líneas, con 2 espacios de sangría por nivel;
- `ensure_ascii=False` deja las tildes y la ñ tal cual. Sin ella, `"año"` se escribe `"año"`, que es lo mismo en JSON pero cuesta más leerlo.

```py
import json

ciudad = {"nombre": "Bogotá", "altitud": 2640, "barrios": ["Chapinero", "Usaquén"]}
print(json.dumps(ciudad))
print(json.dumps(ciudad, indent=2, ensure_ascii=False))
```

Con `sort_keys=True`, además, las claves salen en orden alfabético.

## Ejercicio

El texto `texto` describe un libro en JSON. Completa el programa para que:

1. Convierta `texto` en un diccionario `libro` con `json.loads()`.
2. Muestre el título y cuántas etiquetas tiene.
3. Si el libro no tiene descuento (`None`), le ponga un descuento de `10` y añada la clave `"precio_final"`: el precio con ese descuento, como número entero (`precio * (100 - descuento) // 100`).
4. Muestre el libro como JSON con `indent=2` y sin escapar las tildes.

```txt
Título: Python para curiosos
Etiquetas: 2
{
  "titulo": "Python para curiosos",
  ...
  "descuento": 10,
  "precio_final": 61650
}
```

## Pista

json.loads(texto) te da un dict normal: libro["etiquetas"] es una lista, así que len() te dice cuántas tiene, y libro["descuento"] is None comprueba si falta el descuento. Para mostrarlo al final usa print(json.dumps(libro, indent=2, ensure_ascii=False)).
