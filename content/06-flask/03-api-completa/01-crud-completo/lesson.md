---
title: Una API CRUD completa
minutes: 18
summary: "Las cinco operaciones de una API REST: listar, ver, crear, reemplazar o modificar y borrar."
web: http://127.0.0.1:5000/contactos
---

Ya sabes leer y crear. Una API completa sobre un recurso tiene, además, modificar y borrar: las operaciones **CRUD**. En una API REST, cada una es un método sobre una de dos URL, la colección y un elemento:

- `GET /contactos`: listar;
- `POST /contactos`: crear (`201`);
- `GET /contactos/<id>`: ver uno;
- `PUT /contactos/<id>`: reemplazarlo entero (todos los campos son obligatorios);
- `PATCH /contactos/<id>`: cambiar solo los campos que lleguen;
- `DELETE /contactos/<id>`: borrarlo (`204`, sin cuerpo).

### Funciones de ayuda

Varias vistas necesitan lo mismo: buscar un elemento por su id y responder `404` si no existe, o validar los datos. Sácalo a funciones para no repetirlo. `abort()` también funciona dentro de una función de ayuda: termina la petición aunque no estés en la vista.

```py
from flask import Flask, abort, request

app = Flask(__name__)
LIBROS = [{"id": 1, "titulo": "Coco", "leido": False}, {"id": 2, "titulo": "Roma", "leido": True}]


def buscar(id):
    for libro in LIBROS:
        if libro["id"] == id:
            return libro
    abort(404)


@app.patch("/libros/<int:id>")
def modificar(id):
    libro = buscar(id)
    datos = request.get_json()
    if "leido" in datos:
        libro["leido"] = datos["leido"]
    return libro


@app.delete("/libros/<int:id>")
def borrar(id):
    LIBROS.remove(buscar(id))
    return "", 204


cliente = app.test_client()
print(cliente.patch("/libros/1", json={"leido": True}).get_json())
r = cliente.delete("/libros/2")
print(r.status_code, repr(r.get_data(as_text=True)))
print(cliente.delete("/libros/2").status_code)
print(LIBROS)
```

### PUT y PATCH con la misma validación

La validación de `PUT` y la de `PATCH` solo se diferencian en una cosa: en `PUT` faltar un campo es un error, y en `PATCH` no. Una función con un parámetro `parcial` sirve para las dos:

```py
CAMPOS = ("nombre", "telefono")


def validar(datos, parcial):
    errores = {}
    for campo in datos:
        if campo not in CAMPOS:
            errores[campo] = "campo desconocido"
    for campo in CAMPOS:
        if campo not in datos:
            if not parcial:
                errores[campo] = "es obligatorio"
        elif not isinstance(datos[campo], str) or not datos[campo].strip():
            errores[campo] = "no puede estar vacío"
    return errores


print(validar({"nombre": "Ana"}, parcial=False))
print(validar({"nombre": "Ana"}, parcial=True))
print(validar({"apodo": "Anita", "telefono": " "}, parcial=True))
```

Avisar de los **campos desconocidos** ayuda mucho a quien usa la API: si escribe `"nombr"`, se entera enseguida en lugar de preguntarse por qué no cambia nada.

## Ejercicio

Completa la API de contactos con `validar()` y las vistas que faltan. Los campos son `nombre` y `telefono`, dos textos no vacíos:

- `validar(datos, parcial)` devuelve un diccionario con los problemas: `"campo desconocido"`, `"es obligatorio"` (solo si `parcial` es `False`) o `"no puede estar vacío"` (si no es un texto o está vacío).
- `POST /contactos`: valida (sin `parcial`); si hay problemas, `422` con `{"error": "Datos no válidos", "detalles": ...}`. Si no, crea el contacto con id el mayor más uno, y responde `201`.
- `PUT /contactos/<id>`: igual que crear, pero reemplaza el nombre y el teléfono del contacto. Responde `200` con el contacto.
- `PATCH /contactos/<id>`: valida con `parcial=True` y cambia solo los campos que lleguen.
- `DELETE /contactos/<id>`: lo borra y responde `204` sin cuerpo.

Con un id que no existe, `PUT`, `PATCH` y `DELETE` responden `404`. Guarda los textos sin espacios en los extremos. `buscar()`, la lista y ver un contacto ya están hechos.

## Pista

En cada vista que recibe datos: datos = request.get_json(), errores = validar(datos, parcial=...) y if errores: return {"error": "Datos no válidos", "detalles": errores}, 422. En PATCH, recorre los campos que llegaron: for campo in datos: contacto[campo] = datos[campo].strip().
