import sqlite3 as _sqlite3

_cine = _sqlite3.connect("cine.db")
_columnas = [fila[1] for fila in _cine.execute("PRAGMA table_info(peliculas)")]
assert _columnas == ["id", "titulo", "anio", "duracion", "nota"], "La tabla peliculas debería tener las columnas id, titulo, anio, duracion y nota, en ese orden"
_cine.execute("INSERT INTO peliculas (titulo, anio, duracion) VALUES ('Metrópolis', 1927, 153)")
_cine.execute("INSERT INTO peliculas (titulo, anio, nota) VALUES ('Coco', 2017, 8.4)")
_filas = _cine.execute("SELECT id, titulo, anio, duracion, nota FROM peliculas ORDER BY id").fetchall()
assert _filas == [(1, "Metrópolis", 1927, 153, 0), (2, "Coco", 2017, None, 8.4)], "Una película válida debería guardarse con su id, y nota 0 si no se da: " + str(_filas)


def _debe_fallar(sql, motivo):
    try:
        _cine.execute(sql)
    except _sqlite3.IntegrityError:
        return
    raise AssertionError("La tabla debería impedir " + motivo + ": " + sql)


_debe_fallar("INSERT INTO peliculas (titulo, anio) VALUES ('Coco', 2020)", "repetir un título (UNIQUE)")
_debe_fallar("INSERT INTO peliculas (anio) VALUES (2020)", "una película sin título (NOT NULL)")
_debe_fallar("INSERT INTO peliculas (titulo) VALUES ('Sin año')", "una película sin año (NOT NULL)")
_debe_fallar("INSERT INTO peliculas (titulo, anio) VALUES ('Muy antigua', 1800)", "un año anterior a 1888 (CHECK)")
_debe_fallar("INSERT INTO peliculas (titulo, anio, nota) VALUES ('Demasiado buena', 2020, 11)", "una nota mayor que 10 (CHECK)")
_debe_fallar("INSERT INTO peliculas (titulo, anio, nota) VALUES ('Muy mala', 2020, -1)", "una nota negativa (CHECK)")
_debe_fallar("INSERT INTO peliculas (titulo, anio, nota) VALUES ('Sin nota', 2020, NULL)", "una nota NULL (NOT NULL)")
_cine.close()
