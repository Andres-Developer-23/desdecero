import sqlite3 as _sqlite3

try:
    conexion.close()
except NameError:
    pass
_agenda = _sqlite3.connect("agenda.db")
_filas = _agenda.execute("SELECT id, nombre, telefono, ciudad FROM contactos ORDER BY id").fetchall()
assert len(_filas) == 5, "Al abrir agenda.db con otra conexión debería haber 5 contactos y hay " + str(len(_filas)) + ": ¿confirmaste los cambios con commit()?"
assert _filas[0] == (1, "Ana Ruiz", "3001112233", "Bogotá"), "El primer contacto debería ser Ana Ruiz, con id 1"
assert _filas[3] == (4, "Mateo Herrera", "3150001122", None), "Mateo Herrera no tiene ciudad: debería guardarse NULL (None)"
assert _filas[4] == (5, "Laura Gil", "3005550199", "Manizales"), "El último contacto debería ser Laura Gil, con id 5"
try:
    _agenda.execute("INSERT INTO contactos (nombre, telefono) VALUES ('Repetido', '3001112233')")
    raise AssertionError("La tabla debería impedir repetir un teléfono (UNIQUE)")
except _sqlite3.IntegrityError:
    pass
_agenda.close()
