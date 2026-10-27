---
title: if, elif y else
minutes: 20
summary: Ejecutar código solo cuando se cumple una condición, y la sangría que marca cada bloque.
---

`if` ejecuta un bloque de código solo si la condición es verdadera. La sintaxis tiene dos detalles que no se pueden olvidar: los **dos puntos** al final de la línea del `if` y la **sangría** (4 espacios) de las líneas que dependen de él.

```py
temperatura = 31
if temperatura > 30:
    print("Hace calor")
    print("Bebe agua")
print("Esta línea se ejecuta siempre")
```

La sangría es la forma que tiene Python de saber qué líneas están dentro del `if`. En el editor, al pulsar Enter después de los dos puntos, la sangría se añade sola.

Con `else` indicas qué hacer cuando la condición es falsa, y con `elif` (abreviatura de *else if*) encadenas más casos. Python comprueba las condiciones de arriba abajo y ejecuta **solo el primer bloque** que se cumple:

```py
nota = 4.2
if nota >= 4.5:
    print("Excelente")
elif nota >= 4.0:
    print("Muy bien")
elif nota >= 3.0:
    print("Aprobado")
else:
    print("Reprobado")
```

Con `nota = 4.2` también se cumple `nota >= 3.0`, pero da igual: Python ya entró en el bloque de "Muy bien" y se salta el resto. Por eso el orden importa: ve de la condición más exigente a la menos exigente.

## Ejercicio

Escribe un programa que pida una temperatura (puede tener decimales) y muestre un mensaje según el valor:

- menos de 10: `Hace frío`
- de 10 a menos de 25: `Está templado`
- 25 o más: `Hace calor`

El comprobador probará con 5, 10, 18.5, 25 y 33.

## Pista

Empieza con if temperatura < 10:, sigue con elif temperatura < 25: y termina con else:. No olvides los dos puntos ni los 4 espacios de sangría.
