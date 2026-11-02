import json as _json

try:
    with open("tareas.json", encoding="utf-8") as _archivo:
        _tareas = _json.load(_archivo)
except FileNotFoundError:
    raise AssertionError("Tu programa debería guardar las tareas en tareas.json")
assert isinstance(_tareas, list), "tareas.json debería guardar una lista de tareas"
for _tarea in _tareas:
    for _clave in ("id", "descripcion", "estado", "creada", "actualizada"):
        assert _clave in _tarea, "Cada tarea de tareas.json debería tener la clave «" + _clave + "». Esta no la tiene: " + str(_tarea)
_ids = [_tarea["id"] for _tarea in _tareas]
assert _ids == [1, 3, 4], "Después de todas las órdenes, tareas.json debería tener las tareas 1, 3 y 4, con su id como número. Tiene: " + str(_ids)
assert [_tarea["estado"] for _tarea in _tareas] == ["en-curso", "hecha", "pendiente"], "Los estados guardados deberían ser «en-curso», «hecha» y «pendiente». Son: " + str([_tarea["estado"] for _tarea in _tareas])
assert _tareas[0]["descripcion"] == "Comprar pan integral", "La tarea 1 debería guardar su descripción actualizada, «Comprar pan integral»"
assert len(_tareas[0]["creada"]) >= 16, "«creada» debería guardar la fecha y la hora, como «2026-10-27 18:30:00»"
