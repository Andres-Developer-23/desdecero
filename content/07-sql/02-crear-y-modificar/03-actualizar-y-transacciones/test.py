import sqlite3 as _sqlite3

_c = _sqlite3.connect("libreria.db")


def _stock(libro_id):
    return _c.execute("SELECT stock FROM libros WHERE id = ?", (libro_id,)).fetchone()[0]


def _ventas():
    return _c.execute("SELECT COUNT(*) FROM ventas").fetchone()[0]


_antes = _ventas()
_id = vender(_c, 3, 7, 2, "2026-11-03")
assert _id == _antes + 1, "vender() debería devolver el id de la venta nueva (" + str(_antes + 1) + "), no " + repr(_id)
assert _c.execute("SELECT cliente_id, libro_id, cantidad, fecha FROM ventas WHERE id = ?", (_id,)).fetchone() == (3, 7, 2, "2026-11-03"), "La venta debería guardarse con su cliente, libro, cantidad y fecha"
assert _stock(7) == 13, "Después de vender 2, el libro 7 debería tener 13 unidades (tenía 15)"
assert not _c.in_transaction, "Después de una venta, los cambios deberían quedar confirmados (commit)"

try:
    vender(_c, 1, 4, 5, "2026-11-03")
    raise AssertionError("Vender 5 unidades del libro 4, que solo tiene 3, debería lanzar ValueError")
except ValueError as error:
    assert str(error) == "No hay stock suficiente", "El error debería decir «No hay stock suficiente», no «" + str(error) + "»"
assert _stock(4) == 3 and _ventas() == _antes + 1, "Una venta sin stock no debería cambiar nada"

try:
    vender(_c, 1, 99, 1, "2026-11-03")
    raise AssertionError("Vender un libro que no existe debería lanzar ValueError")
except ValueError as error:
    assert str(error) == "El libro no existe", "El error debería decir «El libro no existe», no «" + str(error) + "»"

try:
    vender(_c, 1, 4, -2, "2026-11-03")
    raise AssertionError("Una cantidad negativa debería fallar: la tabla ventas exige cantidad > 0")
except _sqlite3.IntegrityError:
    pass
assert _stock(4) == 3, "Si el INSERT falla, el stock no debería cambiar: usa una transacción (with conexion:) para que se deshaga todo"
assert _ventas() == _antes + 1, "Si algo falla, no debería quedar ninguna venta nueva"
_c.close()
