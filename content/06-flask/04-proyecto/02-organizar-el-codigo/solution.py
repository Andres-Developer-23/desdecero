from dataclasses import asdict, dataclass

from flask import Flask, abort, request


@dataclass
class Producto:
    id: int
    nombre: str
    precio: int


class Catalogo:
    def __init__(self):
        self.productos = []
        self.siguiente_id = 1

    def listar(self):
        return list(self.productos)

    def obtener(self, id):
        """El producto con ese id, o None."""
        for producto in self.productos:
            if producto.id == id:
                return producto
        return None

    def crear(self, nombre, precio):
        """Crea un producto con el siguiente id, lo guarda y lo devuelve."""
        producto = Producto(self.siguiente_id, nombre, precio)
        self.productos.append(producto)
        self.siguiente_id += 1
        return producto

    def borrar(self, id):
        """Lo borra y devuelve True, o False si no existía."""
        producto = self.obtener(id)
        if producto is None:
            return False
        self.productos.remove(producto)
        return True


def crear_app(catalogo):
    app = Flask(__name__)
    app.json.ensure_ascii = False

    @app.get("/productos")
    def listar():
        return [asdict(producto) for producto in catalogo.listar()]

    @app.get("/productos/<int:id>")
    def ver(id):
        producto = catalogo.obtener(id)
        if producto is None:
            abort(404)
        return asdict(producto)

    @app.post("/productos")
    def crear():
        datos = request.get_json()
        producto = catalogo.crear(datos["nombre"], datos["precio"])
        return asdict(producto), 201

    @app.delete("/productos/<int:id>")
    def borrar(id):
        if not catalogo.borrar(id):
            abort(404)
        return "", 204

    return app


catalogo = Catalogo()
catalogo.crear("Cuaderno", 8500)
catalogo.crear("Lápiz", 1200)
app = crear_app(catalogo)

if __name__ == "__main__":
    app.run(debug=True)
