assert not app.debug, "Arranca el servidor sin debug=True: en modo debug, Flask no usa el manejador de 500"
cliente = app.test_client()
r = cliente.get("/libros/9")
assert r.status_code == 404, "GET /libros/9 debería responder 404, y responde " + str(r.status_code)
assert r.is_json, "Los errores deberían responder JSON: añade un manejador con @app.errorhandler(HTTPException)"
assert r.get_json() == {"codigo": 404, "error": "Not Found", "mensaje": "No existe el libro 9"}, "GET /libros/9 debería dar " + str({"codigo": 404, "error": "Not Found", "mensaje": "No existe el libro 9"}) + " y da " + r.get_data(as_text=True)
r = cliente.get("/no-existe")
assert r.status_code == 404 and r.get_json()["mensaje"].startswith("The requested URL was not found"), "Una ruta que no existe también debería dar el error en JSON, con la descripción de Flask"
r = cliente.post("/libros/1")
assert r.status_code == 405 and r.get_json()["error"] == "Method Not Allowed", "Un método no permitido debería responder 405 en JSON"
assert cliente.get("/libros/1").get_json() == LIBROS[0], "GET /libros/1 debería seguir funcionando"
r = cliente.get("/recomendado")
assert r.status_code == 500, "GET /recomendado debería responder 500, y responde " + str(r.status_code)
assert r.get_json() == {"codigo": 500, "error": "Error interno del servidor"}, "El error 500 debería ser {\"codigo\": 500, \"error\": \"Error interno del servidor\"}, y es " + r.get_data(as_text=True)
