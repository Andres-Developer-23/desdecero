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
    errores = {}
    for campo in datos:
        if campo not in CAMPOS:
            errores[campo] = "campo desconocido"
    for campo in CAMPOS:
        if campo not in datos:
            if not parcial:
                errores[campo] = "es obligatorio"
        elif not isinstance(datos[campo], str) or not datos[campo].strip():
            errores[campo] = "no puede estar vacío"
    return errores


@app.get("/contactos")
def listar():
    return CONTACTOS


@app.get("/contactos/<int:id>")
def ver(id):
    return buscar(id)


@app.post("/contactos")
def crear():
    datos = request.get_json()
    errores = validar(datos, parcial=False)
    if errores:
        return {"error": "Datos no válidos", "detalles": errores}, 422
    contacto = {
        "id": max([c["id"] for c in CONTACTOS] + [0]) + 1,
        "nombre": datos["nombre"].strip(),
        "telefono": datos["telefono"].strip(),
    }
    CONTACTOS.append(contacto)
    return contacto, 201


@app.put("/contactos/<int:id>")
def reemplazar(id):
    contacto = buscar(id)
    datos = request.get_json()
    errores = validar(datos, parcial=False)
    if errores:
        return {"error": "Datos no válidos", "detalles": errores}, 422
    contacto["nombre"] = datos["nombre"].strip()
    contacto["telefono"] = datos["telefono"].strip()
    return contacto


@app.patch("/contactos/<int:id>")
def modificar(id):
    contacto = buscar(id)
    datos = request.get_json()
    errores = validar(datos, parcial=True)
    if errores:
        return {"error": "Datos no válidos", "detalles": errores}, 422
    for campo in datos:
        contacto[campo] = datos[campo].strip()
    return contacto


@app.delete("/contactos/<int:id>")
def borrar(id):
    CONTACTOS.remove(buscar(id))
    return "", 204


if __name__ == "__main__":
    app.run(debug=True)
