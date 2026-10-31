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
        return None

    def crear(self, nombre, precio):
        """Crea un producto con el siguiente id, lo guarda y lo devuelve."""
        return None

    def borrar(self, id):
        """Lo borra y devuelve True, o False si no existía."""
        return False


def crear_app(catalogo):
    app = Flask(__name__)
    app.json.ensure_ascii = False

    @app.get("/productos")
    def listar():
        return [asdict(producto) for producto in catalogo.listar()]

    # Añade GET y DELETE /productos/<int:id> y POST /productos

    return app


catalogo = Catalogo()
catalogo.crear("Cuaderno", 8500)
catalogo.crear("Lápiz", 1200)
app = crear_app(catalogo)

if __name__ == "__main__":
    app.run(debug=True)
