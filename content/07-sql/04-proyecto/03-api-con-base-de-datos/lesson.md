---
title: Una API de Flask con base de datos
minutes: 22
summary: "El proyecto final: una API de Flask que lee y guarda en SQLite, con una conexión por petición (g y teardown_appcontext), transacciones y los códigos de error adecuados."
db: libreria.db
web: http://127.0.0.1:5000/libros
---

Es hora de juntar las dos rutas: una API de Flask cuyos datos viven en una base de datos. Lo primero es decidir **cuándo abrir la conexión**.

### Una conexión por petición

Abrir una conexión global al principio del programa parece lo más sencillo, pero el servidor de Flask atiende cada petición en un hilo (*thread*) distinto, y una conexión de `sqlite3` solo se puede usar en el hilo que la creó (si no, Python lanza `ProgrammingError: SQLite objects created in a thread can only be used in that same thread`). La forma de Flask, la de su tutorial oficial, es abrir una conexión **por petición** y cerrarla al terminar:

- `g` es un objeto de Flask para guardar lo que quieras **mientras dura una petición**. Cada petición empieza con un `g` vacío.
- Una función decorada con `@app.teardown_appcontext` se llama **al terminar cada petición**, también si la vista falló. Ahí se cierra la conexión.

```py
import sqlite3
from flask import Flask, g, request

app = Flask(__name__)
app.json.ensure_ascii = False


def obtener_db():
    """La conexión de esta petición: se abre la primera vez que se pide."""
    if "db" not in g:
        g.db = sqlite3.connect("libreria.db")
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def cerrar_db(error):
    db = g.pop("db", None)
    if db is not None:
        db.close()


@app.get("/clientes")
def listar_clientes():
    filas = obtener_db().execute("SELECT id, nombre, ciudad FROM clientes ORDER BY nombre")
    return [dict(fila) for fila in filas]


@app.post("/clientes")
def crear_cliente():
    datos = request.get_json(silent=True) or {}
    nombre = str(datos.get("nombre", "")).strip()
    ciudad = str(datos.get("ciudad", "")).strip()
    if not nombre or not ciudad:
        return {"error": "Faltan el nombre o la ciudad"}, 422
    db = obtener_db()
    try:
        with db:
            cursor = db.execute(
                "INSERT INTO clientes (nombre, ciudad, email) VALUES (?, ?, ?)",
                (nombre, ciudad, datos.get("email")),
            )
    except sqlite3.IntegrityError:
        return {"error": "Ya hay un cliente con ese email"}, 409
    return {"id": cursor.lastrowid, "nombre": nombre, "ciudad": ciudad}, 201


cliente = app.test_client()
print(cliente.get("/clientes").get_json()[:2])
nueva = {"nombre": "Laura Gil", "ciudad": "Manizales", "email": "laura.gil@correo.example"}
r = cliente.post("/clientes", json=nueva)
print(r.status_code, r.get_json())
r = cliente.post("/clientes", json=dict(nueva, nombre="Otra Laura"))
print(r.status_code, r.get_json())

if __name__ == "__main__":
    app.run(debug=True)
```

- Las vistas piden la conexión con `obtener_db()`, que la abre solo si esta petición todavía no la tiene.
- Como cada petición cierra su conexión al terminar, **lo que no se confirma se pierde**: por eso el `INSERT` va dentro de `with db:`.
- La base de datos valida por ti: el email es `UNIQUE`, y el `IntegrityError` se convierte en un `409 Conflict`, el código para «choca con lo que ya hay».

Ejecútalo y pruébalo en la pestaña **web**: pide `/clientes` y envía un `POST` con un cliente nuevo. Después abre la pestaña **datos**: la tabla `clientes` tiene las filas que guardó tu API.

### Los códigos de una API con base de datos

- `200` o `201` (con la cabecera `Location`) cuando todo va bien;
- `404` si lo que se pide no existe: `fetchone()` devolvió `None`, o `rowcount` es 0;
- `422` si los datos no son válidos, comprobados **antes** de tocar la base de datos;
- `409` si la operación choca con el estado de los datos: un valor `UNIQUE` repetido, o no quedan unidades.

## Ejercicio

Completa la API de la librería. `GET /libros` ya funciona (con el filtro `?categoria=`); te faltan tres rutas:

- `GET /libros/<id>`: el libro, con las mismas claves que en la lista, o `404` con `{"error": ...}`.
- `POST /ventas`, con un JSON `{"cliente_id": 3, "libro_id": 7, "cantidad": 2}`:
  - `422` con `{"error": ...}` si falta un campo o no es un entero mayor que 0;
  - `404` si el cliente o el libro no existen;
  - `409` si no hay stock suficiente;
  - si todo va bien, en una transacción: descuenta las unidades del stock, guarda la venta con la fecha de hoy (`date.today().isoformat()`) y responde `201` con la venta (como en `GET /ventas/<id>`) y la cabecera `Location`.
- `GET /ventas/<id>`: la venta como `{"id", "fecha", "cliente", "libro", "cantidad", "total"}`, con el **nombre** del cliente, el **título** del libro y `total` = cantidad × precio del libro; o `404`.

Pruébala en la pestaña **web** (un `POST` a `/ventas`) y mira cómo cambian `ventas` y el stock de `libros` en **datos**.

## Pista

Para validar, una comprobación como `isinstance(valor, int) and valor > 0` para cada campo. Comprueba el cliente con `SELECT id FROM clientes WHERE id = ?` y el libro con `SELECT stock FROM libros WHERE id = ?`. La venta se responde con la misma consulta de `ver_venta`: sepárala en una función `buscar_venta(id)` que usen las dos vistas. Para la cabecera, `url_for("ver_venta", id=...)`.
