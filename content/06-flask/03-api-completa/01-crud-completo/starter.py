from flask import Flask, abort, request

app = Flask(__name__)
app.json.ensure_ascii = False

CAMPOS = ("nombre", "telefono")
CONTACTOS = [
    {"id": 1, "nombre": "Ana Ruiz", "telefono": "3001234567"},
    {"id": 2, "nombre": "Luis Mora", "telefono": "3109876543"},
]


def buscar(id):
    for contacto in CONTACTOS:
        if contacto["id"] == id:
            return contacto
    abort(404)


def validar(datos, parcial):
    """Devuelve un diccionario {campo: problema}."""
    return {}


@app.get("/contactos")
def listar():
    return CONTACTOS


@app.get("/contactos/<int:id>")
def ver(id):
    return buscar(id)


# Añade POST /contactos, PUT, PATCH y DELETE /contactos/<int:id>


if __name__ == "__main__":
    app.run(debug=True)
