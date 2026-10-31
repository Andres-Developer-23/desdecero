prueba = Catalogo()
creado = prueba.crear("Regla", 3000)
assert creado == Producto(1, "Regla", 3000), "Catalogo.crear() debería devolver el Producto creado con id 1, y devuelve " + repr(creado)
assert prueba.crear("Goma", 900).id == 2, "Cada producto nuevo debería tener el siguiente id"
assert prueba.obtener(2).nombre == "Goma" and prueba.obtener(7) is None, "Catalogo.obtener() debería dar el producto, o None si no existe"
assert prueba.borrar(1) is True and prueba.borrar(1) is False, "Catalogo.borrar() debería dar True al borrar y False si no existía"
assert [p.id for p in prueba.listar()] == [2], "Después de borrar el 1, solo debería quedar el 2"

tienda = Catalogo()
tienda.crear("Mapa", 15000)
otra = Catalogo()
cliente = crear_app(tienda).test_client()
r = cliente.get("/productos/1")
assert r.status_code == 200 and r.get_json() == {"id": 1, "nombre": "Mapa", "precio": 15000}, "GET /productos/1 debería dar el producto, y da " + r.get_data(as_text=True)
assert cliente.get("/productos/5").status_code == 404, "GET de un producto que no existe debería responder 404"
r = cliente.post("/productos", json={"nombre": "Brújula", "precio": 22000})
assert r.status_code == 201 and r.get_json() == {"id": 2, "nombre": "Brújula", "precio": 22000}, "POST /productos debería crear el producto 2 y responder 201, y responde " + r.get_data(as_text=True)
assert tienda.obtener(2).nombre == "Brújula", "POST /productos debería guardar el producto en el catálogo de la app"
assert crear_app(otra).test_client().get("/productos").get_json() == [], "Cada app debería usar su propio catálogo"
r = cliente.delete("/productos/1")
assert r.status_code == 204 and tienda.obtener(1) is None, "DELETE /productos/1 debería borrarlo y responder 204"
assert cliente.delete("/productos/1").status_code == 404, "DELETE de un producto que no existe debería responder 404"
