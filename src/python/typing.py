"""
Versión mínima del módulo typing para el navegador (Skulpt no lo trae).

Las anotaciones de tipo no se evalúan al ejecutar, así que basta con que
los nombres existan para que "from typing import Callable" funcione.
"""

TYPE_CHECKING = False


class _Alias:
    def __init__(self, name):
        self._name = name

    def __getitem__(self, item):
        return self

    def __repr__(self):
        return "typing." + self._name


Any = _Alias("Any")
Callable = _Alias("Callable")
Optional = _Alias("Optional")
Union = _Alias("Union")
List = _Alias("List")
Dict = _Alias("Dict")
Tuple = _Alias("Tuple")
Set = _Alias("Set")


def cast(kind, value):
    return value
