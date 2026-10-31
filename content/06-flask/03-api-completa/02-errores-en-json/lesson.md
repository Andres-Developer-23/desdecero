---
title: Errores en JSON
minutes: 14
summary: Cambia las páginas de error HTML de Flask por respuestas JSON con @app.errorhandler.
web: http://127.0.0.1:5000/libros/9
---

Cuando Flask responde un error por su cuenta (una ruta que no existe, un `abort(404)`, un método no permitido), el cuerpo es una **página HTML**. Para un navegador está bien; para un programa que usa tu API, no: espera JSON, y `respuesta.json()` fallaría.

### Manejadores de errores

`@app.errorhandler()` registra una función que se ejecuta cuando ocurre un error. Recibe la excepción y devuelve la respuesta, como una vista. **Ojo**: hay que poner el código en la tupla; si no, ¡el error respondería `200`!

```py
from flask import Flask, abort

app = Flask(__name__)


@app.errorhandler(404)
def no_encontrado(error):
    return {"error": "No encontrado", "detalle": error.description}, 404


@app.get("/libros/<int:id>")
def ver(id):
    abort(404, description=f"No existe el libro {id}")


cliente = app.test_client()
print(cliente.get("/libros/5").get_json())
print(cliente.get("/no-existe").get_json())
```

- `abort(404, description="...")` lleva un mensaje propio al manejador, en `error.description`.
- Sin `description`, Flask pone una descripción genérica en inglés.

### Todos los errores HTTP a la vez

Todos los errores de Flask son excepciones de la clase `HTTPException` (de `werkzeug.exceptions`), con `code`, `name` y `description`. Un manejador para esa clase atiende todos: 400, 404, 405, 415...

```py
from flask import Flask
from werkzeug.exceptions import HTTPException

app = Flask(__name__)


@app.errorhandler(HTTPException)
def error_http(error):
    return {"codigo": error.code, "error": error.name, "mensaje": error.description}, error.code


@app.get("/solo-get")
def solo_get():
    return {"ok": True}


cliente = app.test_client()
print(cliente.post("/solo-get").get_json())
print(cliente.get("/otra").get_json()["error"])
```

### Errores inesperados: 500

Si una vista falla con una excepción (un `KeyError`, una división entre cero...), Flask responde `500 Internal Server Error`. Con un manejador para `500` también puede ser JSON. Nunca incluyas en la respuesta el detalle del error: puede revelar cómo está hecho tu servidor. El detalle va al registro (la consola), que solo ves tú.

```py
from flask import Flask

app = Flask(__name__)


@app.errorhandler(500)
def error_interno(error):
    return {"error": "Algo falló en el servidor"}, 500


@app.get("/dividir/<int:a>/<int:b>")
def dividir(a, b):
    return {"resultado": a / b}


cliente = app.test_client()
print(cliente.get("/dividir/6/3").get_json())
print(cliente.get("/dividir/6/0").get_json())
```

En la consola verás el registro del error (`ERROR in app: Exception on /dividir/6/0`) con la explicación.

**En modo debug no se usa el manejador de 500**: Flask deja pasar el error para que lo veas con detalle (en la pestaña web, el depurador; en `test_client()`, la excepción). Por eso, en esta lección el servidor arranca con `app.run()`, sin `debug=True`.

## Ejercicio

La API de la biblioteca ya funciona, pero sus errores son páginas HTML. Haz que todos respondan JSON:

- Un manejador para `HTTPException` que responda `{"codigo": ..., "error": ..., "mensaje": ...}` con el código, el nombre y la descripción del error, y con su código de estado.
- Un manejador para `500` que responda `{"codigo": 500, "error": "Error interno del servidor"}` con el código `500`.
- En `ver_libro`, cuando el libro no existe, usa `abort(404, ...)` con la descripción `No existe el libro 9` (con el id pedido).

La ruta `/recomendado` tiene un error a propósito: sirve para probar el manejador de 500. No la arregles.

## Pista

from werkzeug.exceptions import HTTPException y @app.errorhandler(HTTPException) sobre una función que reciba error y devuelva ({"codigo": error.code, "error": error.name, "mensaje": error.description}, error.code). Para el 500, @app.errorhandler(500). El abort queda así: abort(404, description=f"No existe el libro {id}").
