import sqlite3 as _sqlite3

_conexion = _sqlite3.connect(":memory:")
_repo = RepositorioTareas(_conexion)
assert _repo.conexion is _conexion, "Guarda la conexión en self.conexion"
_primera = _repo.crear("  Comprar pan  ")
assert _primera == {"id": 1, "titulo": "Comprar pan", "hecha": False}, "crear() debería devolver {'id': 1, 'titulo': 'Comprar pan', 'hecha': False}, y devolvió " + repr(_primera)
assert not _conexion.in_transaction, "crear() debería confirmar la tarea nueva (with self.conexion: o commit())"
_repo.crear("Estudiar SQL")
_repo.crear("Llamar a Ana")
assert [t["id"] for t in _repo.todas()] == [1, 2, 3], "todas() debería devolver las tres tareas, por orden de id"
assert _repo.marcar_hecha(2) is True, "marcar_hecha(2) debería devolver True"
assert not _conexion.in_transaction, "marcar_hecha() debería confirmar el cambio"
assert _repo.marcar_hecha(9) is False, "marcar_hecha() de una tarea que no existe debería devolver False"
assert _repo.buscar(2) == {"id": 2, "titulo": "Estudiar SQL", "hecha": True}, "buscar(2) debería devolver la tarea con hecha True, y devolvió " + repr(_repo.buscar(2))
assert _repo.buscar(9) is None, "buscar() de una tarea que no existe debería devolver None"
assert [t["id"] for t in _repo.todas(solo_pendientes=True)] == [1, 3], "todas(solo_pendientes=True) debería devolver solo las tareas 1 y 3"
assert _repo.borrar(1) is True and _repo.borrar(1) is False, "borrar() debería devolver True la primera vez y False si ya no existe"
assert not _conexion.in_transaction, "borrar() debería confirmar el cambio"
assert [t["titulo"] for t in _repo.todas()] == ["Estudiar SQL", "Llamar a Ana"], "Después de borrar la tarea 1 quedan dos"
try:
    _repo.crear("   ")
    raise AssertionError("crear() con un título vacío debería lanzar ValueError")
except ValueError as error:
    assert str(error) == "El título no puede estar vacío", "El error debería decir «El título no puede estar vacío»"
assert len(_repo.todas()) == 2, "Un título vacío no debería guardarse"
_otra = RepositorioTareas(_conexion)
assert len(_otra.todas()) == 2, "Crear otro repositorio con la misma base de datos no debería borrar las tareas (CREATE TABLE IF NOT EXISTS)"
