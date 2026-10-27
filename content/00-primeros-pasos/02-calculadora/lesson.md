---
title: Python como calculadora
minutes: 15
summary: Operadores aritméticos, el orden de las operaciones y la diferencia entre / y //.
---

Python sabe hacer cuentas. Escribe una operación dentro de `print()` y te muestra el resultado:

```py
print(7 + 3)
print(7 - 3)
print(7 * 3)
print(7 / 2)
```

Estos son los operadores que vas a usar todo el tiempo:

- `+` suma, `-` resta, `*` multiplicación
- `/` división: siempre devuelve un número con decimales (`7 / 2` da `3.5`)
- `//` división entera: descarta los decimales (`7 // 2` da `3`)
- `%` módulo: el resto de la división (`7 % 2` da `1`). Sirve, por ejemplo, para saber si un número es par: si `n % 2` da `0`, es par.
- `**` potencia: `2 ** 10` da `1024`

Las operaciones siguen el mismo orden que en matemáticas: primero potencias, luego multiplicaciones y divisiones, y por último sumas y restas. Usa paréntesis cuando quieras cambiar ese orden o simplemente dejarlo claro:

```py
print(2 + 3 * 4)        # 14: primero la multiplicación
print((2 + 3) * 4)      # 20: primero el paréntesis
print(17 // 5, 17 % 5)  # 3 cajas completas y sobran 2
```

Los decimales se escriben con punto, no con coma: `3.5`, no `3,5`. Con coma, Python entiende que son dos números distintos.

## Ejercicio

Una semana tiene 7 días, cada día 24 horas y cada hora 60 minutos. Imprime **cuántos minutos tiene una semana** calculándolo con una operación (no escribas el resultado a mano).

En la línea siguiente, imprime cuántas **semanas completas** caben en 100 días usando la división entera.

## Pista

Multiplica los tres números en una sola expresión: 7 * 24 * 60. Para las semanas, divide 100 entre 7 con // y te quedas solo con la parte entera.
