---
title: Rutas con variables
minutes: 15
summary: "Partes variables en la URL, convertidores como <int:id> y el error 404 con abort()."
web: http://127.0.0.1:5000/libros
---

Una API no tiene una ruta para cada libro: tiene **una** ruta con una parte variable, `/libros/<id>`, que sirve para todos. En Flask, la parte variable va entre `< >` y llega a la vista como argumento, con el mismo nombre:

```py
from flask import Flask

app = Flask(__name__)


@app.route("/saludo/<nombre>")
def saludo(nombre):
    return {"mensaje": f"Hola, {nombre}"}


@app.route("/doble/<int:numero>")
def doble(numero):
    return {"numero": numero, "doble": numero * 2}


cliente = app.test_client()
print(cliente.get("/saludo/Ana").get_json())
print(cliente.get("/doble/21").get_json())
print(cliente.get("/doble/veinte").status_code)
```

### Convertidores

Sin más, la parte variable es un texto sin barras. Con un **convertidor** delante, Flask comprueba el formato y convierte el valor:

- `<int:id>`: solo números enteros (`/doble/21`), y llega como `int`;
- `<float:precio>`: números con decimales (`/precio/12.5`);
- `<path:ruta>`: un texto que puede incluir barras (`/archivos/fotos/2026/playa.jpg`).

Si el valor no encaja, como `/doble/veinte`, la ruta no coincide y Flask responde `404` por su cuenta: tu vista no llega a ejecutarse.

### Buscar un recurso y el error 404

Lo típico es buscar el recurso en una lista. Si no está, `abort(404)` termina la petición en ese momento con un error `404 Not Found`:

```py
from flask import Flask, abort

app = Flask(__name__)

CIUDADES = [
    {"id": 1, "nombre": "Bogotá", "altitud": 2640},
    {"id": 2, "nombre": "Cali", "altitud": 1018},
]


@app.route("/ciudades/<int:id>")
def ver_ciudad(id):
    for ciudad in CIUDADES:
        if ciudad["id"] == id:
            return ciudad
    abort(404)


cliente = app.test_client()
print(cliente.get("/ciudades/2").get_json())
print(cliente.get("/ciudades/7").status_code)
app.run(debug=True)
```

Este ejemplo también arranca el servidor: prueba en la pestaña **web** `http://127.0.0.1:5000/ciudades/1` y `/ciudades/7`. La página del 404 es HTML; más adelante verás cómo hacer que los errores también sean JSON.

Cuidado con olvidar el `abort(404)`: si la función termina sin `return`, devuelve `None` y Flask no sabe qué responder. Es un error del servidor (`500`), y en la consola verás el motivo.

### La barra final

`@app.route("/libros/")`, con barra al final, funciona como una carpeta: si alguien pide `/libros`, Flask le redirige a `/libros/` (código `308`). Sin barra final, `/libros/` daría `404`. En las APIs lo normal es escribir las rutas **sin** barra final.

## Ejercicio

La lista `LIBROS` tiene cuatro libros. Crea estas rutas:

- `GET /libros`: la lista de libros, pero solo con su `id` y su `titulo`: `[{"id": 1, "titulo": "El faro de la niebla"}, ...]`.
- `GET /libros/<id>`: todos los datos del libro con ese id, que tiene que ser un número entero. Si no existe, `404` con `abort(404)`.
- `GET /categorias/<categoria>/libros`: los títulos de los libros de esa categoría, en una lista. Si no hay ninguno, una lista vacía.

## Pista

Para /libros construye la lista con un for o con una lista por comprensión: [{"id": libro["id"], "titulo": libro["titulo"]} for libro in LIBROS]. Para /libros/<int:id>, recorre LIBROS y devuelve el que tenga ese id; después del for, abort(404). La de categorías recibe categoria como argumento.
