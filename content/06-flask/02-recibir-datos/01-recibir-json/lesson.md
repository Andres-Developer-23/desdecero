---
title: Recibir datos con POST
minutes: 16
summary: Acepta POST en una ruta, lee el JSON con request.get_json() y responde 201 con la cabecera Location.
web: http://127.0.0.1:5000/notas
---

Por defecto, una ruta solo atiende `GET`. Para recibir datos, la ruta tiene que aceptar `POST`. Hay dos formas de decirlo:

```txt
@app.route("/notas", methods=["POST"])
def crear(): ...

@app.post("/notas")
def crear(): ...
```

`@app.get`, `@app.post`, `@app.put`, `@app.patch` y `@app.delete` son atajos de `@app.route(..., methods=[...])`. La misma URL puede tener una vista para cada método, con funciones de **nombres distintos**:

```py
from flask import Flask, request

app = Flask(__name__)
mensajes = []


@app.get("/mensajes")
def listar():
    return mensajes


@app.post("/mensajes")
def crear():
    datos = request.get_json()
    mensajes.append(datos["texto"])
    return {"guardados": len(mensajes)}, 201


cliente = app.test_client()
print(cliente.post("/mensajes", json={"texto": "Hola"}).get_json())
print(cliente.post("/mensajes", json={"texto": "¿Qué tal?"}).get_json())
print(cliente.get("/mensajes").get_json())
print(cliente.delete("/mensajes").status_code)
```

Un método que la ruta no admite (`DELETE`) responde `405 Method Not Allowed`, con la cabecera `Allow` que dice cuáles sí.

### request.get_json()

`request.get_json()` convierte el cuerpo de la petición de JSON a datos de Python. Solo lo hace si la petición dice que envía JSON (`Content-Type: application/json`, que es lo que pone `requests` con `json=`):

- si los datos no vienen en JSON (por ejemplo, con `data=`), Flask responde `415 Unsupported Media Type`;
- si el JSON está mal escrito, responde `400 Bad Request`;
- con `request.get_json(silent=True)`, en esos casos devuelve `None` y decides tú qué responder.

### Crear un recurso: 201 y Location

Al crear algo, una buena API responde `201 Created`, devuelve el recurso con el `id` que le asignó y su dirección en la cabecera `Location`. Para no escribir esa dirección a mano, `url_for()` la construye a partir del **nombre de la vista** y sus valores:

```py
from flask import Flask, request, url_for

app = Flask(__name__)
usuarios = [{"id": 1, "nombre": "Ana"}]


@app.get("/usuarios/<int:id>")
def ver_usuario(id):
    return [u for u in usuarios if u["id"] == id][0]


@app.post("/usuarios")
def crear_usuario():
    datos = request.get_json()
    usuario = {"id": len(usuarios) + 1, "nombre": datos["nombre"]}
    usuarios.append(usuario)
    return usuario, 201, {"Location": url_for("ver_usuario", id=usuario["id"])}


r = app.test_client().post("/usuarios", json={"nombre": "Luis"})
print(r.status, r.headers["Location"], r.get_json())
app.run(debug=True)
```

Desde la pestaña **web** también puedes enviar datos: elige `POST` en el método, despliega *datos y cabeceras para enviar*, escribe el JSON (`{"nombre": "Sofía"}`) y pulsa enviar.

### Los datos viven en memoria

Las listas de estos ejemplos están en la memoria del programa: si el servidor se reinicia, se pierden. En el simulador, cada ejecución empieza de cero. Las aplicaciones reales guardan los datos en una **base de datos**, que es el siguiente paso cuando domines esto.

## Ejercicio

Completa la API de notas:

- `GET /notas/<id>`: la nota con ese id, o `404`.
- `POST /notas`: crea una nota con el `titulo` y el `texto` que llegan en JSON. Su `id` es uno más que el mayor id que haya. Responde `201` con la nota creada y la cabecera `Location` con su dirección (`/notas/3`), construida con `url_for()`.

`GET /notas` ya está hecho.

## Pista

El id nuevo: max(nota["id"] for nota in NOTAS) + 1. La nota es {"id": ..., "titulo": datos["titulo"], "texto": datos["texto"]}; añádela a NOTAS y return nota, 201, {"Location": url_for("ver_nota", id=nota["id"])}, usando el nombre de tu vista de una nota.
