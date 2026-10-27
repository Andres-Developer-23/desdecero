---
title: Crear tus propias funciones
minutes: 20
summary: "def, parámetros y return: escribir una vez, usar muchas veces."
---

Ya usaste muchas funciones: `print()`, `len()`, `input()`. Una **función** es un bloque de código con nombre que puedes ejecutar cuando quieras. Con `def` creas las tuyas:

```py
def saludar(nombre):
    print(f"¡Hola, {nombre}!")

saludar("Ana")
saludar("Diego")
```

`nombre` es un **parámetro**: una variable que recibe el valor que le pasas al llamar a la función, el **argumento**. Definir la función no ejecuta nada; su código corre cada vez que la llamas.

La mayoría de funciones útiles no imprimen: **devuelven** un resultado con `return`, para que puedas guardarlo o usarlo en otra operación.

```py
def area_circulo(radio):
    return 3.14159 * radio ** 2

a = area_circulo(2)
print(a)
print(area_circulo(1) + area_circulo(3))
```

La diferencia entre `print` y `return` es clave: `print` muestra algo en pantalla y nada más; `return` entrega un valor a quien llamó a la función. Cuando Python llega a un `return`, la función termina en ese punto.

Una función puede tener varios parámetros separados por comas, por ejemplo `def imc(peso, altura):`.

## Ejercicio

Escribe una función `precio_final(precio, descuento)` que **devuelva** (con `return`, no con `print`) el precio después de aplicar un descuento en porcentaje. Por ejemplo, `precio_final(80000, 25)` devuelve `60000.0`.

## Pista

El descuento en pesos es precio * descuento / 100. Devuelve el precio menos ese descuento con return.
