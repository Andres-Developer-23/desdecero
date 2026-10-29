"""
csv para el simulador del curso (Skulpt no lo trae).

reader, writer, DictReader y DictWriter con el dialecto "excel" de
CPython: separador ",", comillas dobles solo cuando hacen falta y filas
terminadas en "\\r\\n".
"""

__all__ = [
    "QUOTE_MINIMAL",
    "QUOTE_ALL",
    "QUOTE_NONNUMERIC",
    "QUOTE_NONE",
    "Error",
    "reader",
    "writer",
    "DictReader",
    "DictWriter",
]

QUOTE_MINIMAL = 0
QUOTE_ALL = 1
QUOTE_NONNUMERIC = 2
QUOTE_NONE = 3


class Error(Exception):
    pass


class Dialect:
    delimiter = ","
    quotechar = '"'
    escapechar = None
    doublequote = True
    skipinitialspace = False
    lineterminator = "\r\n"
    quoting = QUOTE_MINIMAL


excel = Dialect

_OPTIONS = ("delimiter", "quotechar", "escapechar", "doublequote", "skipinitialspace", "lineterminator", "quoting")


def _settings(dialect, options):
    settings = {}
    for name in _OPTIONS:
        settings[name] = getattr(dialect, name)
    for name in options:
        if name not in _OPTIONS and name != "strict":
            raise TypeError("'" + name + "' is an invalid keyword argument for this function")
        if name in _OPTIONS:
            settings[name] = options[name]
    if len(settings["delimiter"]) != 1:
        raise TypeError('"delimiter" must be a 1-character string')
    return settings


class _Writer:
    def __init__(self, f, dialect=excel, **options):
        if not hasattr(f, "write"):
            raise TypeError("argument 1 must have a \"write\" method")
        self._file = f
        self._s = _settings(dialect, options)
        self.dialect = dialect

    def _field(self, value):
        s = self._s
        if value is None:
            text = ""
        elif isinstance(value, float):
            text = repr(value)
        else:
            text = str(value)
        quoting = s["quoting"]
        numeric = isinstance(value, (int, float)) and not isinstance(value, bool)
        if quoting == QUOTE_ALL or (quoting == QUOTE_NONNUMERIC and not numeric):
            needs = True
        elif quoting == QUOTE_NONE:
            needs = False
        else:
            needs = (
                s["delimiter"] in text
                or s["quotechar"] in text
                or "\r" in text
                or "\n" in text
                or text[:1] == " " and s["skipinitialspace"]
            )
        if needs:
            quote = s["quotechar"]
            if s["doublequote"]:
                text = text.replace(quote, quote + quote)
            return quote + text + quote
        return text

    def writerow(self, row):
        if isinstance(row, str):
            row = list(row)
        fields = [self._field(value) for value in row]
        if len(fields) == 1 and fields[0] == "":
            fields = [self._s["quotechar"] * 2]
        return self._file.write(self._s["delimiter"].join(fields) + self._s["lineterminator"])

    def writerows(self, rows):
        for row in rows:
            self.writerow(row)


def writer(csvfile, dialect=excel, **options):
    """Escribe filas (listas) en un archivo abierto con open(..., "w", newline="")."""
    return _Writer(csvfile, dialect, **options)


class _Reader:
    def __init__(self, f, dialect=excel, **options):
        self._lines = iter(f)
        self._s = _settings(dialect, options)
        self.dialect = dialect
        self.line_num = 0

    def __iter__(self):
        return self

    def _next_line(self):
        line = next(self._lines)
        self.line_num += 1
        return line

    def __next__(self):
        s = self._s
        delimiter, quote = s["delimiter"], s["quotechar"]
        line = self._next_line()
        fields = []
        field = ""
        in_quotes = False
        was_quoted = False
        i = 0
        while True:
            if i >= len(line):
                if in_quotes:
                    # El campo entre comillas sigue en la línea siguiente.
                    try:
                        line = self._next_line()
                    except StopIteration:
                        raise Error("unexpected end of data")
                    i = 0
                    continue
                break
            c = line[i]
            if in_quotes:
                if c == quote:
                    if s["doublequote"] and i + 1 < len(line) and line[i + 1] == quote:
                        field += quote
                        i += 2
                        continue
                    in_quotes = False
                else:
                    field += c
            elif c == quote and s["quoting"] != QUOTE_NONE and field == "" and not was_quoted:
                in_quotes = True
                was_quoted = True
            elif c == delimiter:
                fields.append(self._convert(field, was_quoted))
                field = ""
                was_quoted = False
                if s["skipinitialspace"]:
                    while i + 1 < len(line) and line[i + 1] == " ":
                        i += 1
            elif c == "\r" or c == "\n":
                rest = line[i:].replace("\r", "").replace("\n", "")
                if rest:
                    raise Error("new-line character seen in unquoted field")
                break
            else:
                field += c
            i += 1
        if fields or field or was_quoted:
            fields.append(self._convert(field, was_quoted))
        return fields

    def _convert(self, field, quoted):
        if self._s["quoting"] == QUOTE_NONNUMERIC and not quoted:
            return float(field) if field else field
        return field


def reader(csvfile, dialect=excel, **options):
    """Lee un CSV: cada fila es una lista de textos."""
    return _Reader(csvfile, dialect, **options)


class DictWriter:
    """Escribe diccionarios como filas, con las columnas de fieldnames."""

    def __init__(self, f, fieldnames, restval="", extrasaction="raise", dialect=excel, **options):
        if extrasaction not in ("raise", "ignore"):
            raise ValueError("extrasaction (" + str(extrasaction) + ") must be 'raise' or 'ignore'")
        self.fieldnames = list(fieldnames)
        self.restval = restval
        self.extrasaction = extrasaction
        self.writer = _Writer(f, dialect, **options)

    def writeheader(self):
        return self.writer.writerow(self.fieldnames)

    def _row(self, rowdict):
        if self.extrasaction == "raise":
            extra = [key for key in rowdict if key not in self.fieldnames]
            if extra:
                raise ValueError("dict contains fields not in fieldnames: " + ", ".join(repr(k) for k in extra))
        return [rowdict.get(key, self.restval) for key in self.fieldnames]

    def writerow(self, rowdict):
        return self.writer.writerow(self._row(rowdict))

    def writerows(self, rowdicts):
        for rowdict in rowdicts:
            self.writerow(rowdict)


class DictReader:
    """Lee un CSV: cada fila es un diccionario con los nombres de la primera fila."""

    def __init__(self, f, fieldnames=None, restkey=None, restval=None, dialect=excel, **options):
        self._fieldnames = fieldnames
        self.restkey = restkey
        self.restval = restval
        self.reader = _Reader(f, dialect, **options)
        self.line_num = 0

    @property
    def fieldnames(self):
        if self._fieldnames is None:
            try:
                self._fieldnames = next(self.reader)
            except StopIteration:
                pass
        self.line_num = self.reader.line_num
        return self._fieldnames

    def __iter__(self):
        return self

    def __next__(self):
        names = self.fieldnames
        row = next(self.reader)
        while row == []:
            row = next(self.reader)
        self.line_num = self.reader.line_num
        result = {}
        for i, name in enumerate(names):
            result[name] = row[i] if i < len(row) else self.restval
        if len(row) > len(names):
            result[self.restkey] = row[len(names) :]
        return result
