"""
abc para el navegador (Skulpt no lo trae): clases abstractas.

    from abc import ABC, abstractmethod

    class Figura(ABC):
        @abstractmethod
        def area(self):
            pass

Una clase que hereda de ABC y tiene métodos marcados con @abstractmethod
no se puede instanciar hasta que una subclase los implemente todos, con
el mismo error que en CPython.
"""

__all__ = ["ABC", "abstractmethod"]


def abstractmethod(funcobj):
    """Marca un método que las subclases tienen que implementar."""
    funcobj.__isabstractmethod__ = True
    return funcobj


def _abstract_methods(cls):
    names = []
    for name in dir(cls):
        value = getattr(cls, name, None)
        if getattr(value, "__isabstractmethod__", False):
            names.append(name)
    return sorted(names)


class ABC:
    """Clase base para las clases abstractas."""

    def __new__(cls, *args, **kwargs):
        missing = _abstract_methods(cls)
        if missing:
            listed = ", ".join("'" + name + "'" for name in missing)
            plural = "s" if len(missing) > 1 else ""
            raise TypeError(
                "Can't instantiate abstract class "
                + cls.__name__
                + " without an implementation for abstract method"
                + plural
                + " "
                + listed
            )
        return object.__new__(cls)
