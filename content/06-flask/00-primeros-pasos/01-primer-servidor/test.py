cliente = app.test_client()
r = cliente.get("/")
assert r.get_data(as_text=True) == "Bienvenido a la API de la biblioteca", "GET / debería responder «Bienvenido a la API de la biblioteca» y responde «" + r.get_data(as_text=True) + "»"
r = cliente.get("/estado")
assert r.status_code == 200, "Crea la ruta /estado: ahora responde " + str(r.status_code)
assert r.get_json() == {"estado": "ok", "libros": 3}, 'GET /estado debería responder {"estado": "ok", "libros": 3} y responde ' + r.get_data(as_text=True)
r = cliente.get("/libros")
assert r.status_code == 200, "Crea la ruta /libros: ahora responde " + str(r.status_code)
assert r.get_json() == LIBROS, "GET /libros debería responder la lista LIBROS en JSON"
LIBROS.append("Un libro nuevo")
assert cliente.get("/estado").get_json()["libros"] == 4, "/estado debería contar los libros con len(LIBROS), no escribir el número"
