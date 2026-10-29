---
title: Operadores y colecciones propias
minutes: 20
summary: __add__ para los operadores, y __len__, __contains__, __iter__ y __getitem__ para objetos que guardan otros.
---

Los operadores de Python también son métodos especiales. `a + b` llama a `a.__add__(b)`, `a * b` a `__mul__`, `a - b` a `__sub__`... Si los escribes, tus objetos funcionan con los operadores como los números:

```py
class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __add__(self, otro):
        return Vector(self.x + otro.x, self.y + otro.y)

    def __mul__(self, numero):
        return Vector(self.x * numero, self.y * numero)

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"


a = Vector(1, 2)
b = Vector(3, 4)
print(a + b)
print(a * 3)
print(a + b * 2)
```

Fíjate en que `__add__` y `__mul__` **devuelven un objeto nuevo** y no cambian `a` ni `b`, igual que `2 + 3` no cambia el 2.

Muchas clases sirven para guardar otros objetos: una lista de reproducción guarda canciones, un inventario guarda productos. Con unos pocos métodos especiales se comportan como las colecciones de Python:

- `__len__` → `len(objeto)`.
- `__contains__` → `elemento in objeto`.
- `__iter__` → `for elemento in objeto:`. Lo más fácil es devolver `iter()` de la lista interna.
- `__getitem__` → `objeto[0]`, y también los índices negativos y las porciones si delegas en una lista.

```py
class Estanteria:
    def __init__(self):
        self.libros = []

    def poner(self, titulo):
        self.libros.append(titulo)

    def __len__(self):
        return len(self.libros)

    def __contains__(self, titulo):
        return titulo in self.libros

    def __iter__(self):
        return iter(self.libros)

    def __getitem__(self, posicion):
        return self.libros[posicion]


estanteria = Estanteria()
estanteria.poner("Rayuela")
estanteria.poner("Pedro Páramo")
print(len(estanteria), "Rayuela" in estanteria, estanteria[-1])
for libro in estanteria:
    print("-", libro)
```

Esto se llama **delegar**: la clase guarda una lista y le pasa el trabajo. Quien usa `Estanteria` no necesita saber que dentro hay una lista; solo ve un objeto que se comporta como una colección.

## Ejercicio

Crea una clase `ListaReproduccion` que reciba un `nombre` y guarde las canciones en una lista interna `canciones`, vacía al principio. Escribe:

- `agregar(cancion)`: añade una canción al final.
- `__len__`, `__contains__`, `__iter__` y `__getitem__`, delegando en la lista.
- `__add__`: devuelve una lista **nueva** llamada `"Rock + Salsa"` (los dos nombres unidos con `" + "`) con las canciones de las dos, primero las de la izquierda.

Con el programa de abajo, la salida debería ser:

```txt
Mix: Rock + Salsa · 5 canciones
1. Bohemia
2. Ruido
3. Calor
4. Sabor
5. Brisa
Última: Brisa
¿Está «Ruido»? True
```

## Pista

En __add__, crea nueva = ListaReproduccion(self.nombre + " + " + otra.nombre) y añádele las canciones de self y luego las de otra. Para __iter__, return iter(self.canciones).
