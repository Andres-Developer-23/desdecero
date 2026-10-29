"""
dataclasses para el navegador (Skulpt no lo trae).

@dataclass escribe por ti __init__, __repr__ y __eq__ a partir de los
campos de la clase, como en CPython:

    @dataclass
    class Punto:
        x: int
        y: int = 0

Admite field(default=..., default_factory=...), herencia de campos,
__post_init__, order=True, frozen=True, fields(), asdict(), astuple() y
replace(). En las clases de Flet, @dataclass hace lo mismo que @ft.control.

Diferencia con CPython: Skulpt no guarda las anotaciones, así que cualquier
atributo de la clase que no sea un método cuenta como campo, lleve
anotación o no.
"""

__all__ = [
    "dataclass",
    "field",
    "fields",
    "asdict",
    "astuple",
    "replace",
    "is_dataclass",
    "Field",
    "MISSING",
    "FrozenInstanceError",
]


class _MissingType:
    def __repr__(self):
        return "MISSING"


MISSING = _MissingType()


class FrozenInstanceError(AttributeError):
    pass


class Field:
    """Un campo de una clase de datos, con su valor por defecto."""

    def __init__(self, default=MISSING, default_factory=MISSING, init=True, show=True, compare=True):
        if default is not MISSING and default_factory is not MISSING:
            raise ValueError("cannot specify both default and default_factory")
        self.name = None
        self.default = default
        self.default_factory = default_factory
        self.init = init
        self.repr = show
        self.compare = compare

    @property
    def has_default(self):
        return self.default is not MISSING or self.default_factory is not MISSING

    def make(self):
        """Valor por defecto para una instancia nueva (None si no tiene)."""
        if self.default_factory is not MISSING:
            return self.default_factory()
        if self.default is MISSING:
            return None
        return self.default

    def __repr__(self):
        return "Field(name=" + repr(self.name) + ")"


def field(default=MISSING, default_factory=MISSING, init=True, repr=True, compare=True, **kwargs):
    """Opciones de un campo: field(default_factory=list), field(repr=False)..."""
    return Field(default, default_factory, init, repr, compare)


def _is_bare_annotation(value):
    # "nombre: str" sin valor: lo marca así el parche de Skulpt (skulpt-patches.js).
    return type(value).__name__ == "AnotacionSinValor"


def _is_field_value(value):
    if isinstance(value, (Field, _MissingType)) or _is_bare_annotation(value):
        return True
    if isinstance(value, (property, staticmethod, classmethod)):
        return False
    return not callable(value)


def _collect_fields(klass):
    fields_by_name = {}
    order = []
    for base in reversed(klass.__mro__[1:]):
        for item in getattr(base, "__dataclass_fields__", {}).values():
            if item.name not in fields_by_name:
                order.append(item.name)
            fields_by_name[item.name] = item

    for name in list(klass.__dict__.keys()):
        if name.startswith("__") and name.endswith("__"):
            continue
        value = klass.__dict__[name]
        if not _is_field_value(value):
            continue
        if isinstance(value, Field):
            item = value
        elif _is_bare_annotation(value):
            item = Field()
        else:
            if isinstance(value, (list, dict, set)):
                raise ValueError(
                    "mutable default "
                    + str(type(value))
                    + " for field "
                    + name
                    + " is not allowed: use default_factory"
                )
            item = Field(default=value)
        item.name = name
        if name not in fields_by_name:
            order.append(name)
        fields_by_name[name] = item

        # Como en CPython, la clase conserva el valor por defecto y nada más.
        if item.default is not MISSING:
            setattr(klass, name, item.default)
        else:
            delattr(klass, name)

    result = [fields_by_name[name] for name in order]
    seen_default = None
    for item in result:
        if not item.init:
            continue
        if item.has_default:
            seen_default = item.name
        elif seen_default is not None:
            raise TypeError("non-default argument '" + item.name + "' follows default argument '" + seen_default + "'")
    return result


def _make_init(klass, all_fields, frozen):
    init_fields = [item for item in all_fields if item.init]
    names = [item.name for item in init_fields]

    def __init__(self, *args, **kwargs):
        if len(args) > len(names):
            raise TypeError(
                "__init__() takes "
                + str(len(names) + 1)
                + " positional arguments but "
                + str(len(args) + 1)
                + " were given"
            )
        for key in kwargs:
            if key not in names:
                raise TypeError("__init__() got an unexpected keyword argument '" + key + "'")
        values = {}
        missing = []
        for index in range(len(init_fields)):
            item = init_fields[index]
            if index < len(args):
                if item.name in kwargs:
                    raise TypeError("__init__() got multiple values for argument '" + item.name + "'")
                values[item.name] = args[index]
            elif item.name in kwargs:
                values[item.name] = kwargs[item.name]
            elif item.has_default:
                values[item.name] = item.make()
            else:
                missing.append(item.name)
        if missing:
            quoted = ["'" + name + "'" for name in missing]
            if len(quoted) <= 2:
                listed = " and ".join(quoted)
            else:
                listed = ", ".join(quoted[:-1]) + ", and " + quoted[-1]
            plural = "s" if len(missing) > 1 else ""
            raise TypeError(
                "__init__() missing " + str(len(missing)) + " required positional argument" + plural + ": " + listed
            )
        for item in all_fields:
            value = values[item.name] if item.name in values else item.make()
            if frozen:
                object.__setattr__(self, item.name, value)
            else:
                setattr(self, item.name, value)
        post_init = getattr(self, "__post_init__", None)
        if post_init is not None:
            post_init()

    return __init__


def _values(obj, only_compared=False):
    return tuple(
        getattr(obj, item.name)
        for item in obj.__dataclass_fields__.values()
        if item.compare or not only_compared
    )


def _process(klass, init, show, eq, order, frozen):
    all_fields = _collect_fields(klass)
    klass.__dataclass_fields__ = dict((item.name, item) for item in all_fields)

    if init and "__init__" not in klass.__dict__:
        klass.__init__ = _make_init(klass, all_fields, frozen)

    if show and "__repr__" not in klass.__dict__:

        def __repr__(self):
            parts = [
                item.name + "=" + repr(getattr(self, item.name))
                for item in self.__dataclass_fields__.values()
                if item.repr
            ]
            return type(self).__name__ + "(" + ", ".join(parts) + ")"

        klass.__repr__ = __repr__

    if eq and "__eq__" not in klass.__dict__:

        def __eq__(self, other):
            if other.__class__ is not self.__class__:
                return NotImplemented
            return _values(self, True) == _values(other, True)

        klass.__eq__ = __eq__

    if order:

        def compare(method):
            def operator(self, other):
                if other.__class__ is not self.__class__:
                    return NotImplemented
                return method(_values(self, True), _values(other, True))

            return operator

        klass.__lt__ = compare(lambda a, b: a < b)
        klass.__le__ = compare(lambda a, b: a <= b)
        klass.__gt__ = compare(lambda a, b: a > b)
        klass.__ge__ = compare(lambda a, b: a >= b)

    if frozen:

        def __setattr__(self, name, value):
            raise FrozenInstanceError("cannot assign to field '" + name + "'")

        klass.__setattr__ = __setattr__

        def __hash__(self):
            return hash(_values(self, True))

        klass.__hash__ = __hash__

    return klass


def dataclass(cls=None, init=True, repr=True, eq=True, order=False, frozen=False, **options):
    """Convierte una clase en clase de datos: @dataclass o @dataclass(order=True)."""

    def decorate(klass):
        # Los controles de Flet tienen su propio sistema de campos.
        if getattr(klass, "_flet_type", None) is not None:
            import flet

            return flet.control(klass)
        return _process(klass, init, repr, eq, order, frozen)

    if cls is None:
        return decorate
    return decorate(cls)


def is_dataclass(obj):
    return hasattr(obj, "__dataclass_fields__")


def fields(obj):
    """Los campos de una clase de datos o de una instancia, en orden."""
    if not is_dataclass(obj):
        raise TypeError("must be called with a dataclass type or instance")
    return tuple(obj.__dataclass_fields__.values())


def _convert(value, factory):
    if is_dataclass(value) and not isinstance(value, type):
        return factory(value)
    if isinstance(value, list):
        return [_convert(item, factory) for item in value]
    if isinstance(value, tuple):
        return tuple(_convert(item, factory) for item in value)
    if isinstance(value, dict):
        return dict((key, _convert(item, factory)) for key, item in value.items())
    return value


def asdict(obj):
    """Un diccionario con los campos de la instancia (también los anidados)."""
    if not is_dataclass(obj):
        raise TypeError("asdict() should be called on dataclass instances")
    return dict((item.name, _convert(getattr(obj, item.name), asdict)) for item in fields(obj))


def astuple(obj):
    """Una tupla con los valores de los campos de la instancia."""
    if not is_dataclass(obj):
        raise TypeError("astuple() should be called on dataclass instances")
    return tuple(_convert(getattr(obj, item.name), astuple) for item in fields(obj))


def replace(obj, **changes):
    """Una copia de la instancia con algunos campos cambiados."""
    values = {}
    for item in fields(obj):
        if item.init:
            values[item.name] = changes.pop(item.name) if item.name in changes else getattr(obj, item.name)
    if changes:
        raise TypeError("__init__() got an unexpected keyword argument '" + list(changes)[0] + "'")
    return obj.__class__(**values)
