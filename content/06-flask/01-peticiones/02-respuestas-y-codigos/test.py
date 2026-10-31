cliente = app.test_client()
r = cliente.get("/productos")
assert r.get_json() == [{"nombre": "manzana", "stock": 12}, {"nombre": "pera", "stock": 0}, {"nombre": "uva", "stock": 5}], "GET /productos debería dar la lista ordenada por nombre, y da " + r.get_data(as_text=True)
assert r.headers.get("X-Total-Productos") == "3", "Añade la cabecera X-Total-Productos con el número de productos"
r = cliente.get("/productos/uva")
assert r.status_code == 200 and r.get_json() == {"nombre": "uva", "stock": 5, "disponible": True}, "GET /productos/uva debería dar el stock y disponible true, y da " + r.get_data(as_text=True)
assert cliente.get("/productos/pera").get_json()["disponible"] is False, "La pera no tiene unidades: disponible debería ser false"
r = cliente.get("/productos/kiwi")
assert r.status_code == 404, "Un producto que no existe debería responder 404, y responde " + str(r.status_code)
assert r.get_json() == {"error": "No existe el producto «kiwi»"}, "El error debería ser {\"error\": \"No existe el producto «kiwi»\"}"
assert "«kiwi»" in r.get_data(as_text=True), "El JSON no debería escapar las comillas « »: usa app.json.ensure_ascii = False"
r = cliente.get("/salud")
assert r.status_code == 204 and r.get_data(as_text=True) == "", "GET /salud debería responder 204 sin cuerpo"
