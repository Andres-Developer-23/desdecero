---
title: Clases de datos con @dataclass
minutes: 20
summary: "@dataclass escribe por ti __init__, __repr__ y __eq__ a partir de los campos de la clase."
---

Muchas clases son, sobre todo, un paquete de datos: un `__init__` que copia argumentos a atributos, un `__repr__` que los enseña y un `__eq__` que los compara. Es código repetitivo, así que Python lo puede escribir por ti con el decorador `@dataclass`, del módulo `dataclasses`:

```py
from dataclasses import dataclass


@dataclass
class Punto:
    x: int
    y: int


a = Punto(1, 2)
print(a)
print(a == Punto(1, 2))
print(a.x + a.y)
```

Cada línea `nombre: tipo` declara un **campo**. A partir de ellos, `@dataclass` crea:

- `__init__(self, x, y)`, con los campos en el mismo orden.
- `__repr__`, que enseña `Punto(x=1, y=2)`.
- `__eq__`, que compara todos los campos.

Lo que va después de los dos puntos es una **anotación de tipo**: documenta qué se espera, pero Python no lo comprueba. `Punto("a", "b")` funcionaría igual.

Los campos pueden tener **valor por defecto**, y la clase puede tener métodos como cualquier otra:

```py
from dataclasses import dataclass, field


@dataclass
class Alumno:
    nombre: str
    curso: int = 1
    notas: list = field(default_factory=list)

    def media(self):
        return sum(self.notas) / len(self.notas) if self.notas else 0


ana = Alumno("Ana", 3)
luis = Alumno("Luis")
ana.notas.append(4.5)
ana.notas.append(3.5)
print(ana, ana.media())
print(luis)
```

- Los campos con valor por defecto van **después** de los que no lo tienen, como en las funciones.
- Para listas y diccionarios no se escribe `notas: list = []`, porque todos los alumnos compartirían la misma lista. `field(default_factory=list)` crea una lista nueva para cada objeto (Python da un error si lo intentas con `[]`).

Dos opciones útiles del decorador: `@dataclass(order=True)` añade `<`, `>`, `<=` y `>=`, que comparan los campos en orden; y `@dataclass(frozen=True)` hace que los objetos no se puedan modificar después de crearlos:

```py
from dataclasses import dataclass


@dataclass(order=True, frozen=True)
class Version:
    mayor: int
    menor: int = 0


print(sorted([Version(2, 1), Version(1, 9), Version(2)]))
v = Version(1, 2)
try:
    v.menor = 5
except Exception as error:
    print(type(error).__name__, error)
```

## Ejercicio

Escribe una clase de datos `Tarea` con `@dataclass` y estos campos, en este orden:

- `titulo` (texto, sin valor por defecto).
- `prioridad` (número entero, por defecto `3`).
- `hecha` (booleano, por defecto `False`).
- `etiquetas` (lista, vacía por defecto y distinta para cada tarea).

Añade un método `completar()` que ponga `hecha` en `True`. Con el programa de abajo, la salida debería ser:

```txt
Tarea(titulo='Estudiar', prioridad=1, hecha=False, etiquetas=['clase'])
Pendientes por prioridad:
- Estudiar (1)
- Llamar (2)
- Ordenar (3)
True
```

## Pista

Importa dataclass y field de dataclasses. Los campos se escriben como titulo: str, prioridad: int = 3... y etiquetas: list = field(default_factory=list).
