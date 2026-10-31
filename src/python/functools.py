"""
functools para el navegador (Skulpt no lo trae): wraps, partial, reduce,
cache y lru_cache. wraps es lo que se usa al escribir decoradores, por
ejemplo para proteger las vistas de Flask.
"""

WRAPPER_ASSIGNMENTS = ("__module__", "__name__", "__qualname__", "__doc__")
WRAPPER_UPDATES = ("__dict__",)


def update_wrapper(wrapper, wrapped, assigned=WRAPPER_ASSIGNMENTS, updated=WRAPPER_UPDATES):
    """Copia el nombre y la documentación de wrapped en wrapper."""
    for attr in assigned:
        try:
            value = getattr(wrapped, attr)
        except AttributeError:
            continue
        try:
            setattr(wrapper, attr, value)
        except (AttributeError, TypeError):
            pass
    wrapper.__wrapped__ = wrapped
    return wrapper


def wraps(wrapped, assigned=WRAPPER_ASSIGNMENTS, updated=WRAPPER_UPDATES):
    """Decorador para las funciones envoltorio: conservan el nombre de la original."""

    def decorator(wrapper):
        return update_wrapper(wrapper, wrapped, assigned, updated)

    return decorator


class partial:
    """Una función con algunos argumentos ya puestos: partial(int, base=2)("101") == 5."""

    def __init__(self, func, *args, **keywords):
        self.func = func
        self.args = args
        self.keywords = keywords

    def __call__(self, *args, **keywords):
        merged = dict(self.keywords)
        merged.update(keywords)
        return self.func(*(self.args + args), **merged)

    def __repr__(self):
        parts = [repr(self.func)] + [repr(arg) for arg in self.args]
        parts += [key + "=" + repr(value) for key, value in self.keywords.items()]
        return "functools.partial(" + ", ".join(parts) + ")"


_MISSING = object()


def reduce(function, iterable, initial=_MISSING):
    """Combina los elementos de dos en dos: reduce(lambda a, b: a + b, [1, 2, 3]) == 6."""
    items = iter(iterable)
    if initial is _MISSING:
        try:
            value = next(items)
        except StopIteration:
            raise TypeError("reduce() of empty iterable with no initial value")
    else:
        value = initial
    for item in items:
        value = function(value, item)
    return value


def cmp_to_key(mycmp):
    """Convierte una función de comparación antigua en una clave para sorted()."""

    class K:
        def __init__(self, obj):
            self.obj = obj

        def __lt__(self, other):
            return mycmp(self.obj, other.obj) < 0

        def __gt__(self, other):
            return mycmp(self.obj, other.obj) > 0

        def __eq__(self, other):
            return mycmp(self.obj, other.obj) == 0

        def __le__(self, other):
            return mycmp(self.obj, other.obj) <= 0

        def __ge__(self, other):
            return mycmp(self.obj, other.obj) >= 0

    return K


def lru_cache(maxsize=128, typed=False):
    """Recuerda los resultados de una función para no volver a calcularlos."""

    def decorator(function):
        memory = {}
        order = []

        def wrapper(*args, **kwargs):
            key = (args, tuple(sorted(kwargs.items())))
            if key in memory:
                return memory[key]
            value = function(*args, **kwargs)
            memory[key] = value
            order.append(key)
            if maxsize is not None and len(order) > maxsize:
                del memory[order.pop(0)]
            return value

        def cache_clear():
            memory.clear()
            del order[:]

        wrapper.cache_clear = cache_clear
        return update_wrapper(wrapper, function)

    if callable(maxsize) and not isinstance(maxsize, bool):
        function = maxsize
        maxsize = 128
        return decorator(function)
    return decorator


def cache(function):
    """Como lru_cache(maxsize=None)."""
    return lru_cache(maxsize=None)(function)
