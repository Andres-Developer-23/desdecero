cliente = app.test_client()
r = cliente.post("/login", json={"usuario": "luis", "clave": "clave456"})
assert r.status_code == 200 and r.get_json() == {"token": "tk-luis-8d41e7"}, "POST /login con los datos de luis debería dar su token, y da " + r.get_data(as_text=True)
r = cliente.post("/login", json={"usuario": "luis", "clave": "python123"})
assert r.status_code == 401 and r.get_json() == {"error": "Usuario o clave incorrectos"}, "Una clave equivocada debería responder 401 con el error del enunciado"
assert cliente.post("/login", json={"usuario": "eva", "clave": "x"}).status_code == 401, "Un usuario que no existe debería responder 401"
r = cliente.get("/entradas")
assert r.status_code == 401 and r.get_json() == {"error": "Falta el token"}, "Sin token, GET /entradas debería responder 401 con {\"error\": \"Falta el token\"}, y responde " + str(r.status_code) + " " + r.get_data(as_text=True)
assert r.headers.get("WWW-Authenticate") == "Bearer", "Añade la cabecera WWW-Authenticate: Bearer a los 401"
r = cliente.get("/entradas", headers={"Authorization": "Bearer inventado"})
assert r.status_code == 401 and r.get_json() == {"error": "Token no válido"}, "Con un token que no existe debería responder 401 con {\"error\": \"Token no válido\"}"
ana = {"Authorization": "Bearer tk-ana-5f2b9c"}
r = cliente.get("/entradas", headers=ana)
assert r.get_json() == [{"id": 1, "texto": "Hoy empecé la ruta de Flask."}, {"id": 3, "texto": "Ya sé validar datos."}], "ana debería ver solo sus entradas, con id y texto. Ve: " + r.get_data(as_text=True)
r = cliente.post("/entradas", json={"texto": " Probé el decorador. "}, headers=ana)
assert r.status_code == 201 and r.get_json() == {"id": 4, "texto": "Probé el decorador."}, "POST /entradas debería crear la entrada 4, y responde " + r.get_data(as_text=True)
assert cliente.post("/entradas", json={"texto": "Hola"}).status_code == 401, "POST /entradas también tiene que estar protegida"
r = cliente.post("/entradas", json={"texto": "   "}, headers=ana)
assert r.status_code == 422 and r.get_json() == {"error": "El texto no puede estar vacío"}, "Un texto vacío debería responder 422"
luis = {"Authorization": "Bearer tk-luis-8d41e7"}
assert [e["id"] for e in cliente.get("/entradas", headers=luis).get_json()] == [2], "luis no debería ver las entradas de ana"
