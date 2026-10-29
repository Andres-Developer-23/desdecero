---
title: Cómo se muestra un objeto
minutes: 15
summary: "__str__ y __repr__: qué ve una persona al imprimir tu objeto y qué ve un programador."
---

Si imprimes un objeto de una clase tuya, Python no sabe qué enseñar y muestra algo poco útil: el nombre de la clase y la posición del objeto en la memoria.

```py
class Fraccion:
    def __init__(self, numerador, denominador):
        self.numerador = numerador
        self.denominador = denominador


print(Fraccion(3, 4))
```

Para elegir cómo se muestra existen dos **métodos especiales**, los que empiezan y terminan con dos guiones bajos (en inglés se les llama *dunder*, de *double underscore*). Tú no los llamas: los llama Python en el momento adecuado.

- `__str__` devuelve el texto **para las personas**: lo usan `print()`, `str()` y las f-strings.
- `__repr__` devuelve el texto **para los programadores**: lo que se ve en las listas, al depurar y en la consola interactiva. Por convención, se parece al código que crearía el objeto.

```py
class Fraccion:
    def __init__(self, numerador, denominador):
        self.numerador = numerador
        self.denominador = denominador

    def __str__(self):
        return f"{self.numerador}/{self.denominador}"

    def __repr__(self):
        return f"Fraccion({self.numerador}, {self.denominador})"


tres_cuartos = Fraccion(3, 4)
print(tres_cuartos)
print(f"La mitad de {tres_cuartos} es {Fraccion(3, 8)}")
print(repr(tres_cuartos))
print([tres_cuartos, Fraccion(1, 2)])
```

Fíjate en la última línea: una lista se muestra con el `repr` de sus elementos, no con su `str`. Si solo escribes `__repr__`, Python lo usa también para `print`; por eso, si solo vas a escribir uno, que sea `__repr__`.

Los dos tienen que **devolver** un texto con `return`, no imprimirlo. En un `__repr__` se suele usar `!r` dentro de la f-string, que pone las comillas a los textos: `f"Libro({self.titulo!r})"` da `Libro('Rayuela')` en lugar de `Libro(Rayuela)`.

## Ejercicio

Crea una clase `Producto` con los atributos `nombre` y `precio` (un número entero de pesos) y estos métodos especiales:

- `__str__`: devuelve `Pan · $ 2.500`, con el precio separado por puntos de mil.
- `__repr__`: devuelve `Producto('Pan', 2500)`.

El programa de abajo ya los usa; su salida debería ser:

```txt
Café · $ 18.900
Producto('Café', 18900)
[Producto('Pan', 2500), Producto('Leche', 4200)]
Total del pedido: Pan · $ 2.500 y Leche · $ 4.200
```

## Pista

Para los puntos de mil: f"{self.precio:,}" pone comas (18,900) y .replace(",", ".") las cambia por puntos. En __repr__, {self.nombre!r} añade las comillas.
