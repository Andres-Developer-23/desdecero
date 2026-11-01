"""
sqlite3 para el navegador (Skulpt no lo trae).

Tiene la API del módulo sqlite3 de Python (DB-API 2.0): connect,
Connection, Cursor, execute con parámetros ? y :nombre, fetchone,
fetchall, fetchmany, lastrowid, rowcount, description, sqlite3.Row,
commit, rollback, «with conexion:» y las mismas excepciones.

Por debajo, el motor es SQLite de verdad compilado a WebAssembly
(sql.js), así que el SQL se comporta exactamente como en SQLite. Las
transacciones siguen las reglas de Python: antes de un INSERT, UPDATE,
DELETE o REPLACE se abre una transacción, que hay que confirmar con
commit(); si la conexión se cierra sin hacerlo, los cambios se pierden.

Los archivos (connect("tienda.db")) duran hasta el final de la ejecución;
cada ejecución empieza sin ellos, salvo las bases de práctica del curso.
"""

import _sqlite

apilevel = "2.0"
threadsafety = 1
paramstyle = "qmark"
PARSE_DECLTYPES = 1
PARSE_COLNAMES = 2
LEGACY_TRANSACTION_CONTROL = -1

if not _sqlite.available():
    raise ImportError(
        "No se pudo cargar el motor de SQLite (sql.js). Revisa tu conexión a internet y vuelve a ejecutar."
    )

sqlite_version = _sqlite.sqlite_version()
sqlite_version_info = tuple(int(part) for part in sqlite_version.split("."))


class Warning(Exception):
    pass


class Error(Exception):
    """La clase base de los errores de sqlite3."""


class InterfaceError(Error):
    pass


class DatabaseError(Error):
    pass


class DataError(DatabaseError):
    pass


class OperationalError(DatabaseError):
    """Errores de la base de datos: una tabla que no existe, SQL mal escrito..."""


class IntegrityError(DatabaseError):
    """Se incumple una restricción: UNIQUE, NOT NULL, CHECK o FOREIGN KEY."""


class InternalError(DatabaseError):
    pass


class ProgrammingError(DatabaseError):
    """Un uso incorrecto: parámetros que no cuadran, varias sentencias en execute()..."""


class NotSupportedError(DatabaseError):
    pass


_ERRORS = {
    "DataError": DataError,
    "OperationalError": OperationalError,
    "IntegrityError": IntegrityError,
    "InternalError": InternalError,
    "ProgrammingError": ProgrammingError,
    "NotSupportedError": NotSupportedError,
}


def _checked(result):
    if isinstance(result, dict) and "error" in result:
        raise _ERRORS.get(result["error"], OperationalError)(result["message"])
    return result


def _parameters(parameters):
    """Los parámetros como (nombres, valores): nombres es None para los ? (una secuencia)."""
    if parameters is None:
        return None, []
    if isinstance(parameters, dict):
        keys = list(parameters.keys())
        return keys, [parameters[key] for key in keys]
    try:
        return None, list(parameters)
    except TypeError:
        raise ProgrammingError("parameters are of unsupported type")


class Row:
    """Una fila a la que se puede pedir cada columna por su nombre: fila["titulo"]."""

    def __init__(self, cursor, values):
        self._keys = [column[0] for column in (cursor.description or [])]
        self._values = tuple(values)

    def keys(self):
        return list(self._keys)

    def __getitem__(self, key):
        if isinstance(key, str):
            wanted = key.lower()
            for index in range(len(self._keys)):
                if self._keys[index].lower() == wanted:
                    return self._values[index]
            raise IndexError("No item with that key")
        return self._values[key]

    def __len__(self):
        return len(self._values)

    def __iter__(self):
        return iter(self._values)

    def __eq__(self, other):
        if not isinstance(other, Row):
            return NotImplemented
        return self._keys == other._keys and self._values == other._values

    def __hash__(self):
        return hash((tuple(self._keys), self._values))

    def __repr__(self):
        return "<sqlite3.Row object at 0x" + hex(id(self))[2:] + ">"


class Cursor:
    """Ejecuta sentencias y recorre sus resultados."""

    def __init__(self, connection):
        self.connection = connection
        self.description = None
        self.rowcount = -1
        self.lastrowid = None
        self.arraysize = 1
        self.row_factory = connection.row_factory
        self._rows = []
        self._closed = False

    def _check_open(self):
        if self._closed:
            raise ProgrammingError("Cannot operate on a closed cursor.")
        self.connection._check_open()

    def execute(self, sql, parameters=()):
        """Ejecuta una sentencia SQL, con sus parámetros: execute("... WHERE id = ?", (3,))."""
        self._check_open()
        if not isinstance(sql, str):
            raise TypeError("execute() argument 1 must be str, not " + type(sql).__name__)
        names, values = _parameters(parameters)
        result = _checked(
            _sqlite.execute(self.connection._handle, sql, names, values, self.connection._implicit())
        )
        self._set_result(result)
        return self

    def _set_result(self, result):
        columns = result["columns"]
        if columns is None:
            self.description = None
        else:
            self.description = tuple((name, None, None, None, None, None, None) for name in columns)
        self.rowcount = result["rowcount"]
        if result["lastrowid"] is not None:
            self.lastrowid = result["lastrowid"]
        factory = self.row_factory
        rows = result["rows"]
        self._rows = [factory(self, row) for row in rows] if factory is not None else rows

    def executemany(self, sql, seq_of_parameters):
        """Ejecuta la misma sentencia con cada grupo de parámetros (para insertar muchas filas)."""
        self._check_open()
        total = 0
        executed = False
        for parameters in seq_of_parameters:
            names, values = _parameters(parameters)
            result = _checked(
                _sqlite.execute(self.connection._handle, sql, names, values, self.connection._implicit())
            )
            if result["columns"] is not None:
                raise ProgrammingError("executemany() can only execute DML statements.")
            total += max(result["rowcount"], 0)
            executed = True
        self.description = None
        self.rowcount = total if executed else 0
        self._rows = []
        return self

    def executescript(self, sql_script):
        """Ejecuta varias sentencias separadas por punto y coma."""
        self._check_open()
        _checked(_sqlite.execute_script(self.connection._handle, sql_script))
        self.description = None
        self.rowcount = -1
        self._rows = []
        return self

    def fetchone(self):
        """La siguiente fila, o None si no quedan."""
        self._check_open()
        if not self._rows:
            return None
        return self._rows.pop(0)

    def fetchmany(self, size=None):
        """Las siguientes filas (tantas como size, o arraysize)."""
        self._check_open()
        if size is None:
            size = self.arraysize
        chunk = self._rows[:size]
        self._rows = self._rows[size:]
        return chunk

    def fetchall(self):
        """Todas las filas que quedan, en una lista."""
        self._check_open()
        rows = self._rows
        self._rows = []
        return rows

    def close(self):
        self._closed = True
        self._rows = []

    def setinputsizes(self, sizes):
        pass

    def setoutputsize(self, size, column=None):
        pass

    def __iter__(self):
        return self

    def __next__(self):
        row = self.fetchone()
        if row is None:
            raise StopIteration
        return row


class Connection:
    """Una conexión con una base de datos SQLite."""

    def __init__(self, database, isolation_level="", autocommit=LEGACY_TRANSACTION_CONTROL):
        self.row_factory = None
        self.text_factory = str
        self.isolation_level = isolation_level
        self.autocommit = autocommit
        self._handle = _checked(_sqlite.connect(str(database)))
        self._closed = False

    def _check_open(self):
        if self._closed:
            raise ProgrammingError("Cannot operate on a closed database.")

    def _implicit(self):
        """Si se abre sola una transacción antes de modificar datos (lo normal en Python)."""
        if self.autocommit is True:
            return False
        if self.autocommit is False:
            return True
        return self.isolation_level is not None

    def cursor(self, factory=Cursor):
        self._check_open()
        return factory(self)

    def execute(self, sql, parameters=()):
        return self.cursor().execute(sql, parameters)

    def executemany(self, sql, seq_of_parameters):
        return self.cursor().executemany(sql, seq_of_parameters)

    def executescript(self, sql_script):
        return self.cursor().executescript(sql_script)

    def commit(self):
        """Confirma los cambios de la transacción en curso."""
        self._check_open()
        _checked(_sqlite.commit(self._handle))

    def rollback(self):
        """Deshace los cambios de la transacción en curso."""
        self._check_open()
        _checked(_sqlite.rollback(self._handle))

    def close(self):
        """Cierra la conexión. Lo que no se confirmó con commit() se pierde."""
        if not self._closed:
            _sqlite.close(self._handle)
            self._closed = True

    @property
    def in_transaction(self):
        self._check_open()
        return _sqlite.in_transaction(self._handle)

    @property
    def total_changes(self):
        self._check_open()
        return _sqlite.total_changes(self._handle)

    def create_function(self, name, narg, func, deterministic=False):
        raise NotSupportedError("El simulador del curso no admite create_function()")

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        # Como en Python: confirma si todo fue bien y deshace si hubo una excepción. No cierra.
        if self._closed:
            return False
        if exc_type is None:
            self.commit()
        else:
            self.rollback()
        return False


def connect(database, timeout=5.0, detect_types=0, isolation_level="", check_same_thread=True, factory=Connection, cached_statements=128, uri=False, autocommit=LEGACY_TRANSACTION_CONTROL):
    """Abre una conexión: connect("tienda.db") o connect(":memory:")."""
    return factory(database, isolation_level=isolation_level, autocommit=autocommit)
