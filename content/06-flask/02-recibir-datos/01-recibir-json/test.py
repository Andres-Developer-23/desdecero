cliente = app.test_client()
assert cliente.get("/notas/2").get_json() == NOTAS[1], "GET /notas/2 debería dar la nota 2"
assert cliente.get("/notas/7").status_code == 404, "GET /notas/7 debería responder 404"
r = cliente.post("/notas", json={"titulo": "Cine", "texto": "Ver Coco el sábado"})
assert r.status_code == 201, "POST /notas debería responder 201 y responde " + str(r.status_code)
assert r.get_json() == {"id": 3, "titulo": "Cine", "texto": "Ver Coco el sábado"}, "POST /notas debería devolver la nota creada con id 3, y devuelve " + r.get_data(as_text=True)
assert r.headers.get("Location") == "/notas/3", "Añade la cabecera Location con url_for(): debería ser /notas/3 y es " + str(r.headers.get("Location"))
assert cliente.get("/notas/3").get_json()["titulo"] == "Cine", "Guarda la nota nueva en NOTAS"
NOTAS.append({"id": 10, "titulo": "x", "texto": "y"})
assert cliente.post("/notas", json={"titulo": "a", "texto": "b"}).get_json()["id"] == 11, "El id nuevo debería ser uno más que el mayor id que haya"
assert cliente.post("/notas", data={"titulo": "a"}).status_code == 415, "Lee los datos con request.get_json()"
