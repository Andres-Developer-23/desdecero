cliente = app.test_client()
r = cliente.get("/libros")
assert r.get_json() == [{"id": l["id"], "titulo": l["titulo"]} for l in LIBROS], "GET /libros debería dar solo el id y el título de cada libro, y da " + r.get_data(as_text=True)
r = cliente.get("/libros/4")
assert r.status_code == 200, "GET /libros/4 debería responder 200 y responde " + str(r.status_code)
assert r.get_json() == LIBROS[3], "GET /libros/4 debería dar todos los datos del libro 4"
assert cliente.get("/libros/2").get_json()["titulo"] == "Python para curiosos", "GET /libros/2 debería dar el libro con id 2"
assert cliente.get("/libros/9").status_code == 404, "Un id que no existe debería responder 404: usa abort(404)"
assert cliente.get("/libros/dos").status_code == 404, "Usa <int:id> para que la ruta solo acepte números"
r = cliente.get("/categorias/novela/libros")
assert r.get_json() == ["El faro de la niebla", "La última estación"], "GET /categorias/novela/libros debería dar los títulos de las novelas, y da " + r.get_data(as_text=True)
assert cliente.get("/categorias/poesia/libros").get_json() == ["Versos para un lunes"], "Revisa /categorias/poesia/libros"
assert cliente.get("/categorias/teatro/libros").get_json() == [], "Una categoría sin libros debería dar una lista vacía"
