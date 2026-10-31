from flask import Flask

app = Flask(__name__)

INVENTARIO = {"pera": 0, "manzana": 12, "uva": 5}


@app.route("/productos")
def productos():
    return INVENTARIO


# Añade /productos/<nombre> y /salud


if __name__ == "__main__":
    app.run(debug=True)
