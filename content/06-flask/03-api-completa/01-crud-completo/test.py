cliente = app.test_client()
invalido = {"error": "Datos no válidos", "detalles": {"apodo": "campo desconocido", "nombre": "es obligatorio", "telefono": "no puede estar vacío"}}
r = cliente.post("/contactos", json={"apodo": "Sofi", "telefono": "  "})
assert r.status_code == 422 and r.get_json() == invalido, "POST con datos no válidos debería responder 422 con " + str(invalido) + ", y responde " + str(r.status_code) + " " + r.get_data(as_text=True)
r = cliente.post("/contactos", json={"nombre": " Sofía Cárdenas ", "telefono": "3205550000"})
assert r.status_code == 201 and r.get_json() == {"id": 3, "nombre": "Sofía Cárdenas", "telefono": "3205550000"}, "POST correcto debería responder 201 con el contacto 3 (sin espacios en los extremos), y responde " + r.get_data(as_text=True)
r = cliente.put("/contactos/1", json={"nombre": "Ana Ruiz Gómez", "telefono": "3000000000"})
assert r.status_code == 200 and r.get_json() == {"id": 1, "nombre": "Ana Ruiz Gómez", "telefono": "3000000000"}, "PUT debería reemplazar el contacto, y responde " + r.get_data(as_text=True)
r = cliente.put("/contactos/1", json={"nombre": "Ana"})
assert r.status_code == 422 and r.get_json()["detalles"] == {"telefono": "es obligatorio"}, "En PUT todos los campos son obligatorios"
r = cliente.patch("/contactos/2", json={"telefono": " 3111111111 "})
assert r.status_code == 200 and r.get_json() == {"id": 2, "nombre": "Luis Mora", "telefono": "3111111111"}, "PATCH debería cambiar solo el teléfono, y responde " + r.get_data(as_text=True)
r = cliente.patch("/contactos/2", json={"nombre": 5})
assert r.status_code == 422 and r.get_json()["detalles"] == {"nombre": "no puede estar vacío"}, "PATCH también valida los campos que llegan"
for metodo in ("put", "patch", "delete"):
    estado = getattr(cliente, metodo)("/contactos/99", json={"nombre": "x", "telefono": "y"}).status_code
    assert estado == 404, metodo.upper() + " /contactos/99 debería responder 404, y responde " + str(estado)
r = cliente.delete("/contactos/2")
assert r.status_code == 204 and r.get_data(as_text=True) == "", "DELETE debería responder 204 sin cuerpo"
assert [c["id"] for c in cliente.get("/contactos").get_json()] == [1, 3], "Después de borrar el 2 deberían quedar el 1 y el 3"
