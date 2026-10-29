---
title: JSON anidado y archivos
minutes: 15
summary: Recorre datos dentro de datos, guarda y lee archivos .json y entiende los errores de JSON.
---

Los datos reales casi nunca son planos: un pedido tiene un cliente, el cliente tiene una dirección y el pedido tiene una lista de productos. En JSON eso son objetos y arrays **anidados**, unos dentro de otros.

### Llegar a un dato paso a paso

Para llegar a un dato anidado se encadenan corchetes, de fuera hacia dentro. Si te pierdes, imprime cada paso:

```py
import json

texto = """
{
  "id": 101,
  "cliente": {"nombre": "Ana", "direccion": {"ciudad": "Cali", "barrio": "San Antonio"}},
  "items": [
    {"titulo": "Versos para un lunes", "precio": 28500, "cantidad": 2},
    {"titulo": "La última estación", "precio": 42000, "cantidad": 1}
  ]
}
"""
pedido = json.loads(texto)

print(pedido["cliente"]["direccion"]["ciudad"])
print(pedido["items"][1]["titulo"])

total = 0
for item in pedido["items"]:
    total += item["precio"] * item["cantidad"]
print("Total:", total)
```

- `pedido["cliente"]` es un diccionario, así que se le puede pedir `["direccion"]`, y a ese, `["ciudad"]`.
- `pedido["items"]` es una lista: se recorre con `for` y cada elemento es un diccionario.

Cuando una clave puede faltar, usa `.get()`, que devuelve `None` (o el valor que le indiques) en lugar de lanzar `KeyError`:

```py
import json

cliente = json.loads('{"nombre": "Luis"}')
print(cliente.get("telefono"))
print(cliente.get("telefono", "sin teléfono"))
```

### Guardar y leer archivos JSON

JSON es también una forma cómoda de guardar datos en un archivo para usarlos otro día. Para archivos se usan `json.dump()` y `json.load()`, sin la *s* final:

```py
import json

favoritos = {"usuario": "ana", "libros": [2, 7, 15], "ultima_visita": "2026-10-29"}

with open("favoritos.json", "w", encoding="utf-8") as archivo:
    json.dump(favoritos, archivo, indent=2, ensure_ascii=False)

with open("favoritos.json", encoding="utf-8") as archivo:
    leidos = json.load(archivo)

print(leidos["libros"])
print(leidos == favoritos)
```

- `json.dump(datos, archivo)` escribe los datos en un archivo abierto con `"w"`.
- `json.load(archivo)` lee un archivo abierto y devuelve los datos.

En el simulador, los archivos se guardan en un disco que empieza vacío en cada ejecución; al terminar, la consola enseña lo que guardaste.

### Cuando el JSON no es válido

Si el texto no cumple las reglas de JSON, `json.loads()` lanza `json.JSONDecodeError`. El error dice qué falló y dónde: `msg` es el motivo, `lineno` y `colno` la línea y la columna, y `pos` la posición en el texto.

```py
import json

for texto in ['{"a": 1}', "{'a': 1}", '[1, 2,]']:
    try:
        datos = json.loads(texto)
        print("Válido:", datos)
    except json.JSONDecodeError as error:
        print("No válido:", error.msg, "(columna", str(error.colno) + ")")
```

`JSONDecodeError` es un tipo de `ValueError`, así que `except ValueError` también lo captura.

## Ejercicio

La lista `pedidos` tiene tres pedidos en JSON, pero uno de ellos está mal escrito. Para cada pedido, en orden:

- si el JSON es válido, muestra `Pedido <id> · <nombre> (<ciudad>) · total <total>`, donde el total suma `precio * cantidad` de todos sus `items`;
- si no lo es, muestra `Pedido en la posición <n>: JSON no válido (<motivo>, columna <columna>)`, con la posición empezando en 1 y el motivo y la columna que da el error.

Después guarda en `pedidos.json`, con `json.dump()`, una lista con un resumen de cada pedido válido: `{"id": ..., "cliente": ..., "total": ...}`. Por último, vuelve a leer el archivo con `json.load()` y muestra cuántos pedidos tiene:

```txt
Pedido 101 · Ana (Cali) · total 99000
Pedido en la posición 2: JSON no válido (...)
Pedido 103 · Marta (Bogotá) · total 68500
Guardados: 2
```

## Pista

Recorre la lista con for posicion, texto in enumerate(pedidos, 1) y pon json.loads(texto) dentro de un try. En el except json.JSONDecodeError as error, error.msg y error.colno te dan el motivo y la columna. Ve añadiendo los resúmenes a una lista y, después del bucle, guárdala con json.dump(resumenes, archivo).
