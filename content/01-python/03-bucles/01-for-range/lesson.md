---
title: El bucle for y range()
minutes: 20
summary: Repetir un bloque un número de veces y recorrer secuencias.
---

Un **bucle** repite un bloque de código. El bucle `for` recorre los elementos de una secuencia, uno por uno, y en cada vuelta guarda el elemento actual en una variable:

```py
for letra in "Hola":
    print(letra)
```

Para repetir algo un número concreto de veces se usa `range()`, que genera una secuencia de números:

```py
for i in range(5):
    print("Vuelta", i)
```

`range(5)` va de 0 a 4: empieza en 0 y **no incluye** el número final. `range()` admite hasta tres valores:

- `range(fin)`: de 0 hasta fin - 1
- `range(inicio, fin)`: de inicio hasta fin - 1
- `range(inicio, fin, paso)`: avanza de paso en paso, también hacia atrás si el paso es negativo

```py
for n in range(1, 11, 2):
    print(n)          # 1, 3, 5, 7, 9
for n in range(10, 0, -3):
    print(n)          # 10, 7, 4, 1
```

Igual que con `if`, la línea del bucle termina en dos puntos y el bloque lleva sangría. Todo lo sangrado se repite; lo que viene después sin sangría se ejecuta una sola vez, al terminar el bucle.

## Ejercicio

Pide un número con `input()` e imprime su **tabla de multiplicar del 1 al 10** con este formato:

```txt
7 x 1 = 7
7 x 2 = 14
...
7 x 10 = 70
```

Usa un bucle `for`, nada de diez `print` seguidos.

## Pista

range(1, 11) va del 1 al 10. Dentro del bucle imprime con una f-string: f"{numero} x {i} = {numero * i}".
