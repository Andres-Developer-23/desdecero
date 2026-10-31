from flask import Flask, request

app = Flask(__name__)
app.json.ensure_ascii = False

INSCRIPCIONES = [{"id": 1, "nombre": "Ana Ruiz", "email": "ana@correo.example", "edad": 31}]


def validar(datos):
    """Devuelve un diccionario {campo: problema} con lo que falla."""
    errores = {}
    nombre = datos.get("nombre")
    if not isinstance(nombre, str) or not nombre.strip():
        errores["nombre"] = "es obligatorio"
    email = datos.get("email")
    if not isinstance(email, str) or "@" not in email or "." not in email.split("@")[-1]:
        errores["email"] = "no es un email válido"
    edad = datos.get("edad")
    if isinstance(edad, bool) or not isinstance(edad, int) or not 12 <= edad <= 99:
        errores["edad"] = "debe ser un número entero entre 12 y 99"
    return errores


@app.get("/inscripciones")
def listar():
    return INSCRIPCIONES


@app.post("/inscripciones")
def inscribir():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return {"error": "Envía los datos en JSON"}, 400
    errores = validar(datos)
    if errores:
        return {"error": "Datos no válidos", "detalles": errores}, 422
    email = datos["email"].strip().lower()
    if email in [i["email"] for i in INSCRIPCIONES]:
        return {"error": "Ese email ya está inscrito"}, 409
    inscripcion = {
        "id": len(INSCRIPCIONES) + 1,
        "nombre": datos["nombre"].strip(),
        "email": email,
        "edad": datos["edad"],
    }
    INSCRIPCIONES.append(inscripcion)
    return inscripcion, 201


if __name__ == "__main__":
    app.run(debug=True)
