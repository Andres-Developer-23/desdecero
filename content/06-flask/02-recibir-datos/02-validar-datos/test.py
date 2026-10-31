cliente = app.test_client()


def inscribir(cuerpo, **opciones):
    if opciones:
        r = cliente.post("/inscripciones", **opciones)
    else:
        r = cliente.post("/inscripciones", json=cuerpo)
    return r.status_code, r.get_json()


estado, datos = inscribir({"nombre": "  Luis Mora ", "email": " Luis@Correo.Example ", "edad": 17})
assert estado == 201, "Una inscripción correcta debería responder 201, y responde " + str(estado) + " " + str(datos)
assert datos == {"id": 2, "nombre": "Luis Mora", "email": "luis@correo.example", "edad": 17}, "Guarda el nombre sin espacios y el email en minúsculas, y responde la inscripción con id 2. Tu respuesta: " + str(datos)
estado, datos = inscribir({"nombre": "Otra", "email": "LUIS@correo.example", "edad": 20})
assert estado == 409 and datos == {"error": "Ese email ya está inscrito"}, "Un email ya inscrito (aunque cambie de mayúsculas) debería responder 409, y responde " + str(estado)
estado, datos = inscribir({"nombre": "   ", "email": "sin-arroba", "edad": 8})
assert estado == 422, "Los datos no válidos deberían responder 422, y responde " + str(estado)
assert datos == {"error": "Datos no válidos", "detalles": {"nombre": "es obligatorio", "email": "no es un email válido", "edad": "debe ser un número entero entre 12 y 99"}}, "Revisa los mensajes de detalles: " + str(datos)
estado, datos = inscribir({"nombre": "Eva", "email": "eva@correo", "edad": "30"})
assert datos["detalles"] == {"email": "no es un email válido", "edad": "debe ser un número entero entre 12 y 99"}, "Un email sin punto tras la @ o una edad en texto no son válidos. Tus detalles: " + str(datos.get("detalles"))
estado, datos = inscribir({"nombre": "Eva", "email": "eva@correo.example", "edad": True})
assert estado == 422 and list(datos["detalles"]) == ["edad"], "true no es una edad válida (descarta los bool)"
estado, datos = inscribir(None, data="nombre=Eva")
assert estado == 400 and datos == {"error": "Envía los datos en JSON"}, "Si no llega JSON, responde 400 con {\"error\": \"Envía los datos en JSON\"}"
estado, datos = inscribir(["Eva"])
assert estado == 400, "Si el JSON no es un objeto (por ejemplo, una lista), responde 400"
assert len(INSCRIPCIONES) == 2, "Solo debería haberse guardado la inscripción válida"
