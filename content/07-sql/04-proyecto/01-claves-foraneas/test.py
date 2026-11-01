import sqlite3 as _sqlite3

_c = _sqlite3.connect(":memory:")
_c.execute("PRAGMA foreign_keys = ON")
crear_tablas(_c)
_c.executemany("INSERT INTO estudiantes (id, nombre) VALUES (?, ?)", [(1, "Ana"), (2, "Luis"), (3, "Marta")])
_c.executemany("INSERT INTO cursos (id, nombre) VALUES (?, ?)", [(1, "SQL"), (2, "Python"), (3, "Flask")])
_c.commit()
inscribir(_c, 1, 1)
inscribir(_c, 1, 2)
inscribir(_c, 2, 3)
assert not _c.in_transaction, "inscribir() debería confirmar la inscripción (commit o with conexion:)"
assert cursos_de(_c, 1) == ["Python", "SQL"], "cursos_de(conexion, 1) debería ser ['Python', 'SQL'], en orden alfabético, y es " + repr(cursos_de(_c, 1))
assert cursos_de(_c, 2) == ["Flask"], "cursos_de(conexion, 2) debería ser ['Flask']"
assert cursos_de(_c, 3) == [], "Un estudiante sin cursos debería tener una lista vacía"


def _debe_fallar(estudiante_id, curso_id, motivo):
    try:
        inscribir(_c, estudiante_id, curso_id)
    except _sqlite3.IntegrityError:
        _c.rollback()
        return
    raise AssertionError("inscribir() debería fallar con IntegrityError " + motivo)


_debe_fallar(1, 1, "si el estudiante ya está en ese curso: la clave primaria es (estudiante_id, curso_id)")
_debe_fallar(1, 9, "con un curso que no existe: curso_id es una clave foránea hacia cursos")
_debe_fallar(9, 1, "con un estudiante que no existe: estudiante_id es una clave foránea hacia estudiantes")
_debe_fallar(None, 1, "sin estudiante: estudiante_id es obligatorio")

_c.execute("DELETE FROM estudiantes WHERE id = 1")
_c.commit()
assert _c.execute("SELECT COUNT(*) FROM inscripciones").fetchone()[0] == 1, "Al borrar un estudiante, sus inscripciones deberían borrarse en cascada (ON DELETE CASCADE)"
_c.execute("DELETE FROM cursos WHERE id = 3")
_c.commit()
assert _c.execute("SELECT COUNT(*) FROM inscripciones").fetchone()[0] == 0, "Al borrar un curso, sus inscripciones deberían borrarse en cascada (ON DELETE CASCADE)"
_c.close()
