"""
Versión mínima del módulo dataclasses para el navegador (Skulpt no lo trae).

Incluye field() y @dataclass, lo justo para los ejemplos del curso. En
las clases de Flet, @dataclass hace lo mismo que @ft.control.
"""

MISSING = object()


def field(default=MISSING, default_factory=MISSING, **kwargs):
    import flet

    # Solo se pasa lo que se indicó: flet usa su propio marcador de "sin valor".
    options = {}
    if default is not MISSING:
        options["default"] = default
    if default_factory is not MISSING:
        options["default_factory"] = default_factory
    return flet._FieldDefault(**options)


def dataclass(cls=None, **options):
    def decorate(klass):
        import flet

        if issubclass(klass, flet.Control):
            return flet.control(klass)
        return _plain_dataclass(klass)

    if cls is None:
        return decorate
    return decorate(cls)


def _plain_dataclass(klass):
    import flet

    names = []
    defaults = {}
    for name in list(klass.__dict__.keys()):
        if name.startswith("_"):
            continue
        value = klass.__dict__[name]
        if isinstance(value, (property, staticmethod, classmethod)):
            continue
        if callable(value) and not isinstance(value, flet._FieldDefault):
            continue
        names.append(name)
        defaults[name] = value

    def __init__(self, *args, **kwargs):
        for index in range(len(names)):
            name = names[index]
            if index < len(args):
                value = args[index]
            elif name in kwargs:
                value = kwargs[name]
            else:
                value = flet._fresh(defaults[name])
            setattr(self, name, value)
        post_init = getattr(self, "__post_init__", None)
        if callable(post_init):
            post_init()

    klass.__init__ = __init__
    return klass
