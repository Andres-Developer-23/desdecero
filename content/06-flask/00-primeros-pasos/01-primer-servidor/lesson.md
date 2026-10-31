---
title: Tu primer servidor con Flask
minutes: 14
summary: "Qué es un servidor web y cómo se crea uno con Flask: la aplicación, las rutas y app.run()."
web: http://127.0.0.1:5000/
---

En la ruta de APIs fuiste el **cliente**: tu programa pedía datos a un servidor. Ahora vas a ser el **servidor** (lo que se llama el *backend*): un programa que se queda esperando peticiones y contesta a cada una.

**Flask** es la forma más sencilla de crear un servidor web con Python. Es un *microframework*: trae lo justo para empezar, y se amplía con lo que vayas necesitando. Esta es una aplicación completa:

```py
from flask import Flask

app = Flask(__name__)


@app.route("/")
def inicio():
    return "¡Hola desde mi servidor!"


app.run()
```

- `app = Flask(__name__)` crea la **aplicación**. `__name__` le dice a Flask dónde está tu código.
- `@app.route("/")` es un **decorador**: asocia la ruta `/` con la función que viene debajo. Cuando llega una petición `GET /`, Flask llama a `inicio()`.
- Esa función se llama **vista** (*view*), y lo que devuelve es la respuesta.
- `app.run()` arranca el **servidor de desarrollo** en `http://127.0.0.1:5000`. `127.0.0.1` (o `localhost`) es tu propio ordenador, y `5000` el **puerto**.

### Probarlo en el simulador

En tu ordenador, `app.run()` se queda esperando peticiones hasta que lo paras con Ctrl + C, y el resto del programa no sigue. En el simulador no espera: el servidor queda **en marcha hasta la siguiente ejecución**, y lo pruebas en la pestaña **web**, que hace de navegador. Ejecuta el ejemplo y mira:

- en la pestaña **web**, la respuesta de `http://127.0.0.1:5000/`;
- en la consola, el registro del servidor: una línea por cada petición, con el método, la ruta y el código de estado, como `"GET / HTTP/1.1" 200`.

### Devolver JSON

Si la vista devuelve un diccionario (o una lista), Flask lo convierte en JSON y añade la cabecera `Content-Type: application/json`. Así de fácil es crear una API:

```py
from flask import Flask

app = Flask(__name__)


@app.route("/")
def inicio():
    return "¡Hola desde mi servidor!"


@app.route("/info")
def info():
    return {"nombre": "Mi primera API", "version": 1, "rutas": ["/", "/info"]}


cliente = app.test_client()
respuesta = cliente.get("/info")
print(respuesta.status_code, respuesta.content_type)
print(respuesta.get_json())
print(cliente.get("/no-existe").status_code)
```

`app.test_client()` es un **cliente de pruebas**: hace peticiones a la aplicación sin arrancar el servidor y devuelve la respuesta, con `status_code`, `get_json()` y lo demás. Lo usaremos en los ejemplos para ver resultados en la consola, y en una lección propia para escribir pruebas. Una ruta que no existe responde `404`, sin que tengas que hacer nada.

### En tu ordenador

Para usar Flask de verdad: instálalo con `pip install flask`, guarda el programa como `app.py` y ejecútalo con `python app.py`. Lo habitual es terminar así:

```txt
if __name__ == "__main__":
    app.run(debug=True)
```

- `if __name__ == "__main__":` arranca el servidor solo si ejecutas este archivo directamente, no si otro lo importa.
- `debug=True` activa el **modo de desarrollo**: el servidor se reinicia solo al guardar cambios, los errores se ven con detalle y el JSON sale con sangría. Nunca lo actives en un servidor público: el depurador permite ejecutar código.

## Ejercicio

Crea la API de una biblioteca con tres rutas:

- `GET /`: responde el texto `Bienvenido a la API de la biblioteca`.
- `GET /estado`: responde el JSON `{"estado": "ok", "libros": 3}`, donde `3` es el número de libros de la lista `LIBROS` (calcúlalo con `len()`).
- `GET /libros`: responde la lista `LIBROS` en JSON.

El programa ya termina arrancando el servidor. Ejecútalo y prueba las tres rutas en la pestaña **web**; después, pulsa ✓ comprobar.

## Pista

Cada ruta es un @app.route("/ruta") encima de una función con su propio nombre (estado, libros...). Para /estado devuelve un diccionario: return {"estado": "ok", "libros": len(LIBROS)}. Para /libros basta con return LIBROS.
