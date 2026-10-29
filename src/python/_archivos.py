"""
open() con un disco simulado, para el simulador del curso.

Skulpt no puede guardar archivos. Esta versión de open() los guarda en la
memoria de la página: un programa puede escribir un CSV y volver a leerlo.
Cada ejecución empieza con el disco vacío, y al terminar la consola
muestra los archivos que se crearon.

Solo admite archivos de texto ("r", "w", "a" y "x", con o sin "+").
"""

import _web


class FileNotFoundError(IOError):
    pass


class FileExistsError(IOError):
    pass


def _clean_name(name):
    if not isinstance(name, str):
        raise TypeError("expected str, bytes or os.PathLike object, not " + type(name).__name__)
    while name.startswith("./"):
        name = name[2:]
    return name


class ArchivoVirtual:
    """Un archivo de texto abierto en el disco simulado."""

    def __init__(self, name, mode, newline):
        self.name = name
        self.mode = mode
        self.closed = False
        self._newline = newline
        self._reading = "r" in mode or "+" in mode
        self._writing = mode[0] in "wax" or "+" in mode
        stored = _web.file_read(name)
        if mode[0] == "r":
            if stored is None:
                raise FileNotFoundError("[Errno 2] No such file or directory: '" + name + "'")
            self._data = stored
        elif mode[0] == "x":
            if stored is not None:
                raise FileExistsError("[Errno 17] File exists: '" + name + "'")
            self._data = ""
            _web.file_write(name, "")
        elif mode[0] == "w":
            self._data = ""
            _web.file_write(name, "")
        else:
            self._data = stored or ""
            _web.file_write(name, self._data)
        self._pos = len(self._data) if mode[0] == "a" else 0

    def _check(self, reading):
        if self.closed:
            raise ValueError("I/O operation on closed file.")
        if reading and not self._reading:
            raise IOError("not readable")
        if not reading and not self._writing:
            raise IOError("not writable")

    def _translate_in(self, text):
        if self._newline is None:
            return text.replace("\r\n", "\n").replace("\r", "\n")
        return text

    def write(self, text):
        self._check(False)
        if not isinstance(text, str):
            raise TypeError("write() argument must be str, not " + type(text).__name__)
        stored = text
        if self._newline not in (None, "", "\n"):
            stored = text.replace("\n", self._newline)
        if self.mode[0] == "a":
            self._pos = len(self._data)
        self._data = self._data[: self._pos] + stored + self._data[self._pos + len(stored) :]
        self._pos += len(stored)
        _web.file_write(self.name, self._data)
        return len(text)

    def writelines(self, lines):
        for line in lines:
            self.write(line)

    def read(self, size=-1):
        self._check(True)
        if size is None or size < 0:
            chunk = self._data[self._pos :]
        else:
            chunk = self._data[self._pos : self._pos + size]
        self._pos += len(chunk)
        return self._translate_in(chunk)

    def readline(self, size=-1):
        self._check(True)
        rest = self._data[self._pos :]
        end = len(rest)
        for i in range(len(rest)):
            c = rest[i]
            if c == "\n":
                end = i + 1
                break
            if c == "\r":
                end = i + 2 if rest[i + 1 : i + 2] == "\n" else i + 1
                break
        line = rest[:end]
        self._pos += len(line)
        return self._translate_in(line)

    def readlines(self, hint=-1):
        lines = []
        while True:
            line = self.readline()
            if not line:
                return lines
            lines.append(line)

    def __iter__(self):
        self._check(True)
        return self

    def __next__(self):
        line = self.readline()
        if not line:
            raise StopIteration
        return line

    def seek(self, offset, whence=0):
        self._pos = offset if whence == 0 else len(self._data) + offset
        return self._pos

    def tell(self):
        return self._pos

    def flush(self):
        pass

    def close(self):
        self.closed = True

    def readable(self):
        return self._reading

    def writable(self):
        return self._writing

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
        return False

    def __repr__(self):
        return "<_io.TextIOWrapper name='" + self.name + "' mode='" + self.mode + "' encoding='utf-8'>"


def open(file, mode="r", buffering=-1, encoding=None, errors=None, newline=None, closefd=True, opener=None):
    """Abre un archivo del disco simulado."""
    name = _clean_name(file)
    if not isinstance(mode, str):
        raise TypeError("open() argument 'mode' must be str")
    if "b" in mode:
        raise ValueError(
            "El disco simulado del curso solo guarda texto: abre el archivo sin \"b\" en el modo"
        )
    clean = mode.replace("t", "")
    if not clean or clean[0] not in "rwax" or len([c for c in clean if c in "rwax"]) != 1:
        raise ValueError("invalid mode: '" + mode + "'")
    if newline not in (None, "", "\n", "\r", "\r\n"):
        raise ValueError("illegal newline value: " + repr(newline))
    return ArchivoVirtual(name, clean, newline)
