from flask import Flask, request

app = Flask(__name__)
app.json.ensure_ascii = False

INSCRIPCIONES = [{"id": 1, "nombre": "Ana Ruiz", "email": "ana@correo.example", "edad": 31}]


def validar(datos):
    """Devuelve un diccionario {campo: problema} con lo que falla."""
    errores = {}
    return errores


@app.get("/inscripciones")
def listar():
    return INSCRIPCIONES


@app.post("/inscripciones")
def inscribir():
    datos = request.get_json()
    inscripcion = {"id": len(INSCRIPCIONES) + 1, "nombre": datos["nombre"], "email": datos["email"], "edad": datos["edad"]}
    INSCRIPCIONES.append(inscripcion)
    return inscripcion, 201


if __name__ == "__main__":
    app.run(debug=True)
