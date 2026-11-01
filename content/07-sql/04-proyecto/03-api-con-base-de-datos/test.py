import sqlite3 as _sqlite3
from datetime import date as _date

_cliente = app.test_client()
_hoy = _date.today().isoformat()

_r = _cliente.get("/libros/2")
assert _r.status_code == 200, "GET /libros/2 debería responder 200, y responde " + str(_r.status_code)
assert _r.get_json() == {"id": 2, "titulo": "Python para curiosos", "autor": "Andrés Quintero", "categoria": "Programación", "precio": 68500, "stock": 12}, "GET /libros/2 debería devolver el libro con las mismas claves que la lista: " + repr(_r.get_json())
_r = _cliente.get("/libros/99")
assert _r.status_code == 404 and "error" in _r.get_json(), "GET /libros/99 debería responder 404 con un JSON {'error': ...}"

_r = _cliente.get("/ventas/1")
assert _r.status_code == 200, "GET /ventas/1 debería responder 200, y responde " + str(_r.status_code)
assert _r.get_json() == {"id": 1, "fecha": "2026-09-01", "cliente": "Luis Mora", "libro": "Pequeño atlas de pájaros urbanos", "cantidad": 2, "total": 114600}, "GET /ventas/1 no coincide: " + repr(_r.get_json())
assert _cliente.get("/ventas/999").status_code == 404, "GET /ventas/999 debería responder 404"

_r = _cliente.post("/ventas", json={"cliente_id": 3, "libro_id": 7, "cantidad": 2})
assert _r.status_code == 201, "Una venta válida debería responder 201, y responde " + str(_r.status_code) + ": " + repr(_r.get_json())
_venta = _r.get_json()
assert _venta == {"id": 41, "fecha": _hoy, "cliente": "Sofía Gómez", "libro": "El robot que aprendió a dormir", "cantidad": 2, "total": 69800}, "La venta nueva no coincide: " + repr(_venta)
assert _r.headers.get("Location") == "/ventas/41", "La respuesta debería llevar la cabecera Location: /ventas/41"
assert _cliente.get("/ventas/41").get_json() == _venta, "GET /ventas/41 debería devolver la venta nueva"
assert _cliente.get("/libros/7").get_json()["stock"] == 13, "Después de vender 2, el libro 7 debería tener 13 unidades"

_otra = _sqlite3.connect("libreria.db")
assert _otra.execute("SELECT COUNT(*) FROM ventas").fetchone()[0] == 41, "La venta debería quedar guardada (confirmada) en la base de datos"
_otra.close()

for _datos, _motivo in [
    ({"cliente_id": 3, "libro_id": 7, "cantidad": 0}, "una cantidad de 0"),
    ({"cliente_id": 3, "libro_id": 7, "cantidad": "2"}, "una cantidad que es un texto"),
    ({"cliente_id": 3, "cantidad": 1}, "una venta sin libro_id"),
    ({"libro_id": 7, "cantidad": 1}, "una venta sin cliente_id"),
]:
    _r = _cliente.post("/ventas", json=_datos)
    assert _r.status_code == 422 and "error" in _r.get_json(), "POST /ventas con " + _motivo + " debería responder 422 con un JSON {'error': ...}, y responde " + str(_r.status_code)
_r = _cliente.post("/ventas", data="no es JSON")
assert _r.status_code == 422, "POST /ventas sin JSON debería responder 422, y responde " + str(_r.status_code)
_r = _cliente.post("/ventas", json={"cliente_id": 99, "libro_id": 7, "cantidad": 1})
assert _r.status_code == 404 and "error" in _r.get_json(), "Una venta a un cliente que no existe debería responder 404"
_r = _cliente.post("/ventas", json={"cliente_id": 3, "libro_id": 99, "cantidad": 1})
assert _r.status_code == 404 and "error" in _r.get_json(), "Una venta de un libro que no existe debería responder 404"
_r = _cliente.post("/ventas", json={"cliente_id": 3, "libro_id": 4, "cantidad": 5})
assert _r.status_code == 409 and "error" in _r.get_json(), "Vender 5 unidades del libro 4, que tiene 3, debería responder 409"
assert _cliente.get("/libros/4").get_json()["stock"] == 3, "Una venta rechazada no debería cambiar el stock"
assert _cliente.get("/ventas/42").status_code == 404, "Las ventas rechazadas no deberían guardarse"
