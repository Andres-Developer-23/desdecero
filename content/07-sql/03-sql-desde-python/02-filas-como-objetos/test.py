import sqlite3 as _sqlite3

_c = _sqlite3.connect("libreria.db")
_ficcion = libros_de(_c, "Ciencia ficción")
assert isinstance(_ficcion, list) and all(isinstance(x, dict) for x in _ficcion), "libros_de() debería devolver una lista de diccionarios"
assert _ficcion == [
    {"id": 16, "titulo": "Señales desde Europa", "autor": "Tomás Beltrán", "precio": 49500},
    {"id": 4, "titulo": "La aritmética de las nubes", "autor": "Tomás Beltrán", "precio": 52000},
    {"id": 10, "titulo": "Mapas de un planeta sin nombre", "autor": "Diego Salazar", "precio": 55800},
], "libros_de(conexion, 'Ciencia ficción') no coincide: " + repr(_ficcion)
assert [x["id"] for x in libros_de(_c, "Programación")] == [14, 2, 8], "Los libros deberían ir del más barato al más caro"
assert libros_de(_c, "Cocina") == [], "Una categoría sin libros debería dar una lista vacía"
assert libro(_c, 2) == {"id": 2, "titulo": "Python para curiosos", "autor": "Andrés Quintero", "precio": 68500}, "libro(conexion, 2) no coincide: " + repr(libro(_c, 2))
assert libro(_c, 99) is None, "libro(conexion, 99) debería devolver None"
_c.close()
