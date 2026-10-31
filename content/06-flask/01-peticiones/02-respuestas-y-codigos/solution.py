from flask import Flask

app = Flask(__name__)
app.json.ensure_ascii = False

INVENTARIO = {"pera": 0, "manzana": 12, "uva": 5}


@app.route("/productos")
def productos():
    lista = [{"nombre": nombre, "stock": INVENTARIO[nombre]} for nombre in sorted(INVENTARIO)]
    return lista, 200, {"X-Total-Productos": str(len(INVENTARIO))}


@app.route("/productos/<nombre>")
def producto(nombre):
    if nombre not in INVENTARIO:
        return {"error": f"No existe el producto «{nombre}»"}, 404
    stock = INVENTARIO[nombre]
    return {"nombre": nombre, "stock": stock, "disponible": stock > 0}


@app.route("/salud")
def salud():
    return "", 204


if __name__ == "__main__":
    app.run(debug=True)
