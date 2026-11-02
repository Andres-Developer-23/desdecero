import csv as _csv

try:
    with open("gastos.csv", encoding="utf-8", newline="") as _archivo:
        _lector = _csv.DictReader(_archivo)
        _filas = list(_lector)
        _columnas = _lector.fieldnames
except FileNotFoundError:
    raise AssertionError("Tu programa debería guardar los gastos en gastos.csv")
assert list(_columnas) == ["id", "fecha", "descripcion", "categoria", "importe"], "Las columnas de gastos.csv deberían ser id, fecha, descripcion, categoria e importe. Son: " + str(_columnas)
assert [_fila["id"] for _fila in _filas] == ["1", "3", "4", "5"], "Después de borrar el gasto 2 y añadir otro, gastos.csv debería tener los gastos 1, 3, 4 y 5. Tiene: " + str([_fila["id"] for _fila in _filas])
assert _filas[0]["categoria"] == "comida" and _filas[3]["categoria"] == "educación", "Las categorías deberían guardarse en minúsculas, como «comida» y «educación»"
assert [_fila["importe"] for _fila in _filas] == ["12.50", "18.00", "45.75", "30.00"], "Los importes deberían guardarse con dos decimales, como 12.50. Son: " + str([_fila["importe"] for _fila in _filas])
assert _filas[0]["fecha"] == "2026-10-03" and _filas[0]["descripcion"] == "Almuerzo", "El primer gasto debería ser el almuerzo del 2026-10-03: " + str(_filas[0])
