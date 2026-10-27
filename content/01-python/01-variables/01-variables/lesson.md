---
title: "Variables: guardar datos con nombre"
minutes: 15
summary: Asignar con =, elegir buenos nombres y cambiar el valor de una variable.
---

Una **variable** es un nombre que apunta a un valor. Se crea con el signo `=`: a la izquierda va el nombre y a la derecha el valor.

```py
nombre = "Lucía"
edad = 28
print(nombre)
print(edad)
```

En programación, `=` no significa "es igual a": significa **asigna**. `edad = 28` se lee "guarda 28 en edad". Por eso puedes cambiar el valor más adelante, incluso a partir del valor anterior:

```py
puntos = 10
puntos = puntos + 5
print(puntos)   # 15
puntos += 5     # forma corta de puntos = puntos + 5
print(puntos)   # 20
```

Reglas para los nombres:

- Pueden tener letras, números y guiones bajos, pero no pueden empezar por un número.
- Sin espacios: usa `precio_total`, no `precio total`. Este estilo con guiones bajos se llama *snake_case* y es el habitual en Python.
- Mayúsculas y minúsculas cuentan: `Edad` y `edad` son variables distintas.
- Elige nombres que expliquen qué guardan: `precio` dice mucho más que `x`.

Las variables se combinan en operaciones igual que los números:

```py
precio = 12.5
cantidad = 4
total = precio * cantidad
print("Total:", total)
```

## Ejercicio

Crea tres variables:

- `producto` con el texto `"Cuaderno"`
- `precio` con el valor `3.5`
- `unidades` con el valor `6`

Después crea `total`, que sea el precio por las unidades. La última línea ya imprime el resultado: `Cuaderno x 6 = 21.0`.

## Pista

El texto va entre comillas y los números sin ellas. total se calcula con precio * unidades.
