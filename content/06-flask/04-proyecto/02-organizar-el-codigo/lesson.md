---
title: Organizar el código
minutes: 16
summary: Separa los datos de las vistas con una clase de datos y un repositorio, y crea la aplicación con una función.
web: http://127.0.0.1:5000/productos
---

Cuando una API crece, mezclarlo todo en las vistas se vuelve un lío: cada vista busca en listas, valida, construye diccionarios y responde. Una forma clásica de ordenarlo es separar **tres capas**:

- el **modelo**: cómo es un dato (`Producto`), con una clase de datos;
- el **repositorio**: dónde se guardan los datos y cómo se buscan, crean o borran (`Catalogo`);
- las **vistas**: solo traducen entre HTTP y el repositorio. Leen la petición, llaman al repositorio y responden.

### El modelo y el repositorio

```py
from dataclasses import asdict, dataclass


@dataclass
class Producto:
    id: int
    nombre: str
    precio: int


class Catalogo:
    def __init__(self):
        self.productos = []
        self.siguiente_id = 1

    def crear(self, nombre, precio):
        producto = Producto(self.siguiente_id, nombre, precio)
        self.productos.append(producto)
        self.siguiente_id += 1
        return producto

    def obtener(self, id):
        for producto in self.productos:
            if producto.id == id:
                return producto
        return None


catalogo = Catalogo()
catalogo.crear("Cuaderno", 8500)
print(catalogo.crear("Lápiz", 1200))
print(catalogo.obtener(1), catalogo.obtener(9))
print(asdict(catalogo.obtener(2)))
```

El repositorio no sabe nada de HTTP: se puede usar y probar sin Flask. Y si mañana guardas los datos en una base de datos, solo cambia `Catalogo`; las vistas siguen igual.

Para responder, `asdict()` convierte el objeto en un diccionario. Ojo: una vista **no** puede devolver directamente un objeto `Producto` (Flask solo acepta textos, diccionarios, listas y respuestas), pero `jsonify(producto)` sí sabe convertir clases de datos.

### Crear la aplicación con una función

En lugar de una `app` global, muchos proyectos la crean con una función, la **fábrica de aplicaciones** (*application factory*). Recibe lo que necesita, como el repositorio, y devuelve la aplicación lista:

```py
from dataclasses import asdict, dataclass

from flask import Flask


@dataclass
class Nota:
    id: int
    texto: str


def crear_app(notas):
    app = Flask(__name__)

    @app.get("/notas")
    def listar():
        return [asdict(nota) for nota in notas]

    return app


app_a = crear_app([Nota(1, "Hola")])
app_b = crear_app([])
print(app_a.test_client().get("/notas").get_json())
print(app_b.test_client().get("/notas").get_json())
```

Las vistas se definen **dentro** de la función y usan sus variables (`notas`). Así cada aplicación tiene sus propios datos, lo que viene muy bien en las pruebas: cada prueba crea una aplicación nueva y no se pisan.

En proyectos grandes, además, las rutas se reparten en varios archivos con los **Blueprints** de Flask, que agrupan las vistas de una parte de la API.

## Ejercicio

Organiza la tienda en capas:

- `Catalogo` (el repositorio): completa `obtener(id)` (el producto, o `None`), `crear(nombre, precio)` (crea un `Producto` con el siguiente id, lo guarda y lo devuelve) y `borrar(id)` (lo quita y devuelve `True`, o `False` si no existía).
- `crear_app(catalogo)`: además de `GET /productos`, que ya está, añade `GET /productos/<id>` (`404` si no existe), `POST /productos` (con `nombre` y `precio` en JSON, responde `201` con el producto) y `DELETE /productos/<id>` (`204`, o `404`).

Las vistas no deben tocar `catalogo.productos`: usa solo los métodos del catálogo.

## Pista

En crear(): producto = Producto(self.siguiente_id, nombre, precio), añádelo, suma 1 a siguiente_id y return producto. En borrar(): producto = self.obtener(id); si es None, return False; si no, self.productos.remove(producto) y return True. Las vistas de crear_app usan catalogo.obtener(id) y abort(404) cuando da None.
