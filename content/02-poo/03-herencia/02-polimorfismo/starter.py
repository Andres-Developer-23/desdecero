import math
# Importa lo que necesites de abc


# Escribe aquí Figura, Rectangulo, Circulo y Cuadrado


figuras = [Rectangulo(2, 3), Circulo(1), Cuadrado(4)]
for figura in figuras:
    print(figura.describir())
total = sum(figura.area() for figura in figuras)
print(f"Área total: {total:.2f}")
