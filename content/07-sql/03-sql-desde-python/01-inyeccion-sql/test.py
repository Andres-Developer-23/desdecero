import sqlite3 as _sqlite3

_c = _sqlite3.connect("libreria.db")
assert buscar_libros(_c, "python") == ["Python para curiosos"], "buscar_libros(conexion, 'python') debería devolver ['Python para curiosos']"
assert buscar_libros(_c, "DE", "Novela") == ["Cartas desde el páramo", "El faro de la niebla", "La ciudad de los relojes parados"], "La búsqueda de 'DE' en Novela no coincide: " + repr(buscar_libros(_c, "DE", "Novela"))
assert buscar_libros(_c, "pá") == ["Cartas desde el páramo", "Pequeño atlas de pájaros urbanos"], "buscar_libros(conexion, 'pá') debería encontrar dos libros, en orden alfabético"
assert buscar_libros(_c, "dragón", "Poesía") == [], "No hay ningún libro de Poesía con 'dragón' en el título"
try:
    _resultado = buscar_libros(_c, "d'Artagnan")
except _sqlite3.Error as error:
    raise AssertionError("Un texto con apóstrofo no debería romper la consulta (" + str(error) + "): pasa el texto como parámetro ?")
assert _resultado == [], "Ningún título contiene «d'Artagnan»"
assert buscar_libros(_c, "' OR '1'='1") == [], "Un intento de inyección de SQL en el texto no debería devolver libros: usa parámetros ?"
assert buscar_libros(_c, "a", "Novela' OR '1'='1") == [], "Un intento de inyección de SQL en la categoría no debería devolver libros: usa parámetros ?"
_c.close()
