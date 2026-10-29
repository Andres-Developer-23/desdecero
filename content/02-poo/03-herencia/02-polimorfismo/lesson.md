---
title: Polimorfismo y clases abstractas
minutes: 25
summary: Tratar objetos distintos de la misma forma, y obligar a las subclases a implementar métodos con abc.
---

**Polimorfismo** significa que objetos de clases distintas responden al mismo mensaje, cada uno a su manera. Gracias a eso, el código que los usa no necesita saber de qué clase es cada uno:

```py
class Perro:
    def hablar(self):
        return "¡Guau!"


class Gato:
    def hablar(self):
        return "¡Miau!"


class Robot:
    def hablar(self):
        return "Bip bip."


for cosa in [Perro(), Gato(), Robot()]:
    print(cosa.hablar())
```

El bucle no tiene ni un `if`: le da igual qué haya en la lista, mientras sepa `hablar()`. Si mañana añades una clase `Loro`, el bucle funciona sin cambiar nada. Fíjate en que esas clases ni siquiera heredan de una base común. En Python basta con que el objeto tenga el método: es lo que se conoce como *duck typing* («si camina como un pato y grazna como un pato, es un pato»).

Cuando sí hay una base común, a veces la clase base no debería usarse directamente: no existe «una figura» a secas, sino cuadrados, círculos... Una **clase abstracta** es una base que no se puede instanciar y que **obliga** a sus subclases a implementar ciertos métodos. Se crea con el módulo `abc` (*abstract base classes*):

```py
from abc import ABC, abstractmethod


class Figura(ABC):
    @abstractmethod
    def area(self):
        pass

    def describir(self):
        return f"{type(self).__name__} de área {self.area()}"


class Cuadrado(Figura):
    def __init__(self, lado):
        self.lado = lado

    def area(self):
        return self.lado ** 2


class Triangulo(Figura):
    def __init__(self, base, altura):
        self.base = base
        self.altura = altura


print(Cuadrado(3).describir())
try:
    Figura()
except TypeError as error:
    print("Error:", error)
try:
    Triangulo(3, 4)
except TypeError as error:
    print("Error:", error)
```

- `class Figura(ABC)` la marca como abstracta, y `@abstractmethod` señala los métodos que cada subclase **tiene** que escribir.
- Intentar crear una `Figura`, o una subclase a la que le falta algún método abstracto (como `Triangulo`, que olvidó `area`), da un `TypeError`. El error salta al crear el objeto, no mucho después cuando se llama al método que falta.
- La clase abstracta puede tener métodos normales, como `describir()`, que usan los abstractos. Cada subclase los hereda funcionando.
- `type(self).__name__` es el nombre de la clase del objeto: `Cuadrado`.

## Ejercicio

Crea una clase abstracta `Figura` con dos métodos abstractos, `area()` y `perimetro()`, y un método normal `describir()` que devuelva `"Rectangulo: área 6.00, perímetro 10.00"` (el nombre de la clase y los dos valores con 2 decimales).

Después crea:

- `Rectangulo(base, altura)`.
- `Circulo(radio)`, usando `math.pi`.
- `Cuadrado(lado)`, que hereda de `Rectangulo` y llama a `super().__init__(lado, lado)`.

Con el programa de abajo, la salida debería ser:

```txt
Rectangulo: área 6.00, perímetro 10.00
Circulo: área 3.14, perímetro 6.28
Cuadrado: área 16.00, perímetro 16.00
Área total: 25.14
```

## Pista

Importa ABC y abstractmethod de abc, y math. En describir(): f"{type(self).__name__}: área {self.area():.2f}, perímetro {self.perimetro():.2f}". El perímetro del círculo es 2 * math.pi * radio.
