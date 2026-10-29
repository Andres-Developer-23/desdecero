import math
from abc import ABC, abstractmethod


class Figura(ABC):
    @abstractmethod
    def area(self):
        pass

    @abstractmethod
    def perimetro(self):
        pass

    def describir(self):
        return f"{type(self).__name__}: área {self.area():.2f}, perímetro {self.perimetro():.2f}"


class Rectangulo(Figura):
    def __init__(self, base, altura):
        self.base = base
        self.altura = altura

    def area(self):
        return self.base * self.altura

    def perimetro(self):
        return 2 * (self.base + self.altura)


class Circulo(Figura):
    def __init__(self, radio):
        self.radio = radio

    def area(self):
        return math.pi * self.radio ** 2

    def perimetro(self):
        return 2 * math.pi * self.radio


class Cuadrado(Rectangulo):
    def __init__(self, lado):
        super().__init__(lado, lado)


figuras = [Rectangulo(2, 3), Circulo(1), Cuadrado(4)]
for figura in figuras:
    print(figura.describir())
total = sum(figura.area() for figura in figuras)
print(f"Área total: {total:.2f}")
