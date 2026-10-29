"""
json para el navegador (Skulpt no lo trae).

loads, dumps, load y dump con el comportamiento de CPython: los mismos
tipos, el mismo formato de salida (indent, sort_keys, ensure_ascii,
separators, default) y los mismos mensajes de error. El texto se analiza
en JavaScript, que es mucho más rápido que hacerlo letra a letra en Skulpt.
"""

import _json

__all__ = ["dump", "dumps", "load", "loads", "JSONDecodeError"]


class JSONDecodeError(ValueError):
    """El texto no es JSON válido. Indica qué falló y en qué línea y columna."""

    def __init__(self, msg, doc, pos):
        lineno = doc.count("\n", 0, pos) + 1
        colno = pos - doc.rfind("\n", 0, pos)
        ValueError.__init__(self, "%s: line %d column %d (char %d)" % (msg, lineno, colno, pos))
        self.msg = msg
        self.doc = doc
        self.pos = pos
        self.lineno = lineno
        self.colno = colno


def loads(s, cls=None, object_hook=None, parse_float=None, parse_int=None, parse_constant=None, object_pairs_hook=None, **kw):
    """Convierte un texto JSON en objetos de Python (dict, list, str, int, float, bool, None)."""
    if isinstance(s, bytes):
        s = s.decode("utf-8")
    if not isinstance(s, str):
        raise TypeError("the JSON object must be str, bytes or bytearray, not " + type(s).__name__)
    result = _json.parse(s)
    if not result[0]:
        raise JSONDecodeError(result[1], s, result[2])
    value = result[1]
    if object_hook is not None:
        value = _apply_hook(value, object_hook)
    return value


def _apply_hook(value, hook):
    if isinstance(value, dict):
        return hook(dict((key, _apply_hook(item, hook)) for key, item in value.items()))
    if isinstance(value, list):
        return [_apply_hook(item, hook) for item in value]
    return value


def load(fp, **kw):
    """Lee un archivo JSON abierto con open()."""
    return loads(fp.read(), **kw)


def _float(value, allow_nan):
    if value != value:
        text = "NaN"
    elif value == float("inf"):
        text = "Infinity"
    elif value == -float("inf"):
        text = "-Infinity"
    else:
        return repr(value)
    if not allow_nan:
        raise ValueError("Out of range float values are not JSON compliant: " + repr(value))
    return text


def _key(key, skipkeys):
    if isinstance(key, str):
        return key
    if key is True:
        return "true"
    if key is False:
        return "false"
    if key is None:
        return "null"
    if isinstance(key, float):
        return _float(key, True)
    if isinstance(key, int):
        return str(key)
    if skipkeys:
        return None
    raise TypeError("keys must be str, int, float, bool or None, not " + type(key).__name__)


class _Encoder:
    def __init__(self, skipkeys, ensure_ascii, check_circular, allow_nan, indent, separators, default, sort_keys):
        self.skipkeys = skipkeys
        self.ensure_ascii = ensure_ascii
        self.check_circular = check_circular
        self.allow_nan = allow_nan
        if indent is not None and not isinstance(indent, str):
            indent = " " * indent
        self.indent = indent
        if separators is None:
            separators = (", ", ": ") if indent is None else (",", ": ")
        self.item_separator, self.key_separator = separators
        self.default = default
        self.sort_keys = sort_keys
        self.markers = {}

    def encode(self, value, level):
        if isinstance(value, str):
            return _json.encode_string(value, self.ensure_ascii)
        if value is None:
            return "null"
        if value is True:
            return "true"
        if value is False:
            return "false"
        if isinstance(value, int):
            return str(value)
        if isinstance(value, float):
            return _float(value, self.allow_nan)
        if isinstance(value, (list, tuple)):
            return self._container(value, level, "[", "]", self._list_items(value, level))
        if isinstance(value, dict):
            return self._container(value, level, "{", "}", self._dict_items(value, level))
        if self.default is None:
            raise TypeError("Object of type " + type(value).__name__ + " is not JSON serializable")
        return self._guarded(value, lambda: self.encode(self.default(value), level))

    def _guarded(self, value, make):
        if self.check_circular:
            marker = id(value)
            if marker in self.markers:
                raise ValueError("Circular reference detected")
            self.markers[marker] = True
        try:
            return make()
        finally:
            if self.check_circular:
                del self.markers[id(value)]

    def _list_items(self, value, level):
        return lambda: [self.encode(item, level + 1) for item in value]

    def _dict_items(self, value, level):
        def items():
            pairs = list(value.items())
            if self.sort_keys:
                pairs = sorted(pairs, key=lambda pair: pair[0])
            parts = []
            for key, item in pairs:
                text = _key(key, self.skipkeys)
                if text is None:
                    continue
                parts.append(_json.encode_string(text, self.ensure_ascii) + self.key_separator + self.encode(item, level + 1))
            return parts

        return items

    def _container(self, value, level, opening, closing, make_parts):
        parts = self._guarded(value, make_parts)
        if not parts:
            return opening + closing
        if self.indent is None:
            return opening + self.item_separator.join(parts) + closing
        inner = "\n" + self.indent * (level + 1)
        return opening + inner + (self.item_separator + inner).join(parts) + "\n" + self.indent * level + closing


def dumps(obj, skipkeys=False, ensure_ascii=True, check_circular=True, allow_nan=True, cls=None, indent=None, separators=None, default=None, sort_keys=False, **kw):
    """Convierte objetos de Python en un texto JSON."""
    encoder = _Encoder(skipkeys, ensure_ascii, check_circular, allow_nan, indent, separators, default, sort_keys)
    return encoder.encode(obj, 0)


def dump(obj, fp, **kw):
    """Escribe obj como JSON en un archivo abierto con open(..., "w")."""
    fp.write(dumps(obj, **kw))
