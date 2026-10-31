---
title: Validar los datos
minutes: 16
summary: "Nunca te fíes de lo que llega: comprueba cada campo y responde 400, 409 o 422 con el detalle del problema."
web: http://127.0.0.1:5000/inscripciones
---

Un servidor no puede fiarse de lo que le envían. El cliente puede olvidar un campo, mandar un número como texto, dejar un nombre vacío o enviar algo que ni siquiera es JSON. Si no lo compruebas, en el mejor caso la vista falla con un `KeyError` (un `500`); en el peor, guardas datos basura.

Por eso, antes de guardar nada, se **validan** los datos. Una forma clara de hacerlo es una función que devuelve un diccionario con los problemas de cada campo:

```py
def validar(datos):
    errores = {}
    nombre = datos.get("nombre")
    if not isinstance(nombre, str) or not nombre.strip():
        errores["nombre"] = "es obligatorio"
    precio = datos.get("precio")
    if isinstance(precio, bool) or not isinstance(precio, (int, float)) or precio <= 0:
        errores["precio"] = "debe ser un número mayor que 0"
    return errores


print(validar({"nombre": "Café", "precio": 9500}))
print(validar({"nombre": "  ", "precio": "barato"}))
print(validar({}))
```

- `isinstance()` comprueba el tipo: en JSON, `"9500"` (texto) y `9500` (número) son cosas distintas.
- `True` cuenta como entero en Python (`isinstance(True, int)` es `True`), por eso se descarta aparte.
- `.strip()` evita que un nombre hecho solo de espacios pase por bueno.

### Qué código responder

- `400 Bad Request`: la petición no se puede ni leer (no es JSON, o no es un objeto).
- `422 Unprocessable Entity`: se lee, pero los datos no son válidos. Responde con **todos** los problemas a la vez, para que el cliente los corrija de una vez.
- `409 Conflict`: los datos son válidos, pero chocan con lo que ya existe (un email repetido).

```py
from flask import Flask, request

app = Flask(__name__)
productos = []


def validar(datos):
    errores = {}
    nombre = datos.get("nombre")
    if not isinstance(nombre, str) or not nombre.strip():
        errores["nombre"] = "es obligatorio"
    precio = datos.get("precio")
    if isinstance(precio, bool) or not isinstance(precio, (int, float)) or precio <= 0:
        errores["precio"] = "debe ser un número mayor que 0"
    return errores


@app.post("/productos")
def crear():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return {"error": "Envía los datos como un objeto JSON"}, 400
    errores = validar(datos)
    if errores:
        return {"error": "Datos no válidos", "detalles": errores}, 422
    producto = {"nombre": datos["nombre"].strip(), "precio": datos["precio"]}
    productos.append(producto)
    return producto, 201


cliente = app.test_client()
for cuerpo in [{"nombre": " Café ", "precio": 9500}, {"nombre": "", "precio": -1}, ["Café"]]:
    r = cliente.post("/productos", json=cuerpo)
    print(r.status_code, r.get_json())
```

### Limpiar lo que guardas

Además de comprobar, conviene **normalizar**: quitar los espacios de los extremos, pasar los emails a minúsculas... Así `" Ana "` y `"Ana"` no cuentan como personas distintas, y las búsquedas funcionan.

Es la otra cara de lo que viste en la ruta de APIs: allí recibías los `422` con `detalles` de la API de tareas; ahora eres tú quien los escribe.

## Ejercicio

Completa `POST /inscripciones` para inscribir personas a un taller. Los datos llegan en JSON con `nombre`, `email` y `edad`:

- Si el cuerpo no es un objeto JSON, responde `400` con `{"error": "Envía los datos en JSON"}`.
- Valida los campos y, si alguno falla, responde `422` con `{"error": "Datos no válidos", "detalles": {...}}`, con un mensaje para cada campo que falle.
- El `nombre` falla con `"es obligatorio"` si falta, no es un texto o está vacío (sin contar los espacios).
- El `email` falla con `"no es un email válido"` si no es un texto con una `@` y un punto después de ella.
- La `edad` falla con `"debe ser un número entero entre 12 y 99"` si no lo es.
- Si el email (sin espacios y en minúsculas) ya está inscrito, responde `409` con `{"error": "Ese email ya está inscrito"}`.
- Si todo va bien, guarda y responde `201` con `{"id": ..., "nombre": ..., "email": ..., "edad": ...}`: el nombre sin espacios en los extremos y el email normalizado. El id es el número de inscripciones que hay después de añadirla.

## Pista

El email es válido si isinstance(email, str) and "@" in email and "." in email.split("@")[-1]. Para la edad: isinstance(edad, int) and not isinstance(edad, bool) and 12 <= edad <= 99. Antes de comprobar si está repetido, normaliza con email.strip().lower() y compáralo con los emails de INSCRIPCIONES.
