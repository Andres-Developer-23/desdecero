---
title: Respuestas JSON y códigos de estado
minutes: 15
summary: Qué hace Flask con lo que devuelve una vista, cómo elige el código y las cabeceras, y cómo escribe el JSON.
web: http://127.0.0.1:5000/productos
---

Lo que devuelve una vista decide la respuesta. Flask admite varias formas:

- un **texto** (`str`): respuesta HTML, con código `200`;
- un **diccionario** o una **lista**: respuesta JSON;
- una **tupla** con los datos y el código: `return datos, 201`;
- una tupla con los datos, el código y **cabeceras**: `return datos, 201, {"Location": "/cosas/7"}`.

```py
from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/texto")
def texto():
    return "<b>Hola</b>"


@app.route("/diccionario")
def diccionario():
    return {"ciudad": "Bogotá", "año": 2026, "activa": True}


@app.route("/creado")
def creado():
    return {"id": 7}, 201, {"Location": "/cosas/7"}


@app.route("/con-jsonify")
def con_jsonify():
    return jsonify(1, 2, 3)


cliente = app.test_client()
for ruta in ["/texto", "/diccionario", "/creado", "/con-jsonify"]:
    r = cliente.get(ruta)
    print(ruta, "·", r.status, "·", r.content_type, "·", r.headers.get("Location"))
    print("  ", repr(r.get_data(as_text=True)))
```

`jsonify()` también crea una respuesta JSON. Antes era obligatorio para devolver listas; hoy basta con devolverlas, pero lo verás mucho en el código de otros.

### Cómo escribe Flask el JSON

Fíjate en el cuerpo de `/diccionario`. Flask:

- **ordena las claves** alfabéticamente (`activa`, `año`, `ciudad`), así que el orden de tu diccionario no se conserva en la respuesta;
- escribe lo que no es ASCII como `ñ` (`"año"`), que en JSON es lo mismo que `"año"`;
- quita los espacios para que ocupe menos, salvo en modo debug, que añade sangría.

Las dos primeras cosas se pueden cambiar en `app.json`:

```py
from flask import Flask

app = Flask(__name__)
app.json.ensure_ascii = False
app.json.sort_keys = False


@app.route("/diccionario")
def diccionario():
    return {"ciudad": "Bogotá", "año": 2026, "activa": True}


print(app.test_client().get("/diccionario").get_data(as_text=True))
```

### Elegir el código de estado

El código le dice al cliente qué pasó sin tener que leer el cuerpo:

- `200 OK` para lo normal, `201 Created` al crear algo y `204 No Content` cuando no hay nada que devolver (el cuerpo va vacío: `return "", 204`);
- `400 Bad Request` si la petición está mal, `404 Not Found` si no existe, `409 Conflict` si choca con lo que ya hay.

Con un código de error, devuelve también un JSON con el motivo: `return {"error": "No existe el producto"}, 404`. Es lo que leía tu cliente en la ruta anterior con `respuesta.json()["error"]`.

### Cabeceras propias

Las cabeceras van en el tercer elemento de la tupla. Si necesitas preparar la respuesta paso a paso, `make_response()` la convierte en un objeto que puedes cambiar antes de devolverlo:

```py
from flask import Flask, make_response

app = Flask(__name__)


@app.route("/ciudades")
def ciudades():
    respuesta = make_response(["Cali", "Pasto"])
    respuesta.headers["X-Total"] = "2"
    return respuesta


r = app.test_client().get("/ciudades")
print(r.status_code, r.headers["X-Total"], r.get_json())
```

## Ejercicio

El diccionario `INVENTARIO` guarda cuántas unidades hay de cada producto. Crea:

- `GET /productos`: la lista `[{"nombre": ..., "stock": ...}, ...]` en orden alfabético por nombre, con la cabecera `X-Total-Productos` igual al número de productos.
- `GET /productos/<nombre>`: `{"nombre": ..., "stock": ..., "disponible": ...}`, donde `disponible` es `true` si hay alguna unidad. Si el producto no existe, responde `404` con `{"error": "No existe el producto «kiwi»"}` (con el nombre pedido).
- `GET /salud`: una respuesta vacía con el código `204`.

Configura la aplicación para que el JSON **no escape** las tildes ni las comillas « »: el mensaje de error tiene que llegar tal cual.

## Pista

app.json.ensure_ascii = False, justo después de crear la app. Para la lista: [{"nombre": nombre, "stock": INVENTARIO[nombre]} for nombre in sorted(INVENTARIO)], y devuélvela con la cabecera: return lista, 200, {"X-Total-Productos": str(len(INVENTARIO))}. Para el error: return {"error": f"No existe el producto «{nombre}»"}, 404.
