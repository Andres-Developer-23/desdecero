---
title: Acumular y contar
minutes: 20
summary: El patrón acumulador, los contadores y cuándo cortar un bucle con break.
---

Muchos problemas se resuelven con la misma receta: crear una variable **antes** del bucle y actualizarla en cada vuelta. Se llama patrón **acumulador**.

```py
total = 0
for n in range(1, 6):
    total += n
    print(f"Sumo {n}: el total va en {total}")
print("Total:", total)
```

Un **contador** es lo mismo, pero suma 1 solo cuando se cumple algo:

```py
frase = "programar en python es divertido"
vocales = 0
for letra in frase:
    if letra in "aeiou":
        vocales += 1
print("Vocales:", vocales)
```

El operador `in` comprueba si algo está dentro de otra cosa: `"a" in "aeiou"` es `True`.

Y `break` corta el bucle en cuanto encuentras lo que buscabas, sin dar vueltas de más:

```py
for n in range(1, 100):
    if n * n > 50:
        print(f"{n} es el primer número cuyo cuadrado pasa de 50")
        break
```

## Ejercicio

Recorre los números del **1 al 100** y calcula dos cosas:

- `suma_pares`: la suma de todos los números pares
- `multiplos_7`: cuántos números son múltiplos de 7

Las dos últimas líneas ya imprimen los resultados. Recuerda que `n % 2 == 0` indica que n es par. La palabra `pass` no hace nada: está ahí para que el bucle no quede vacío, reemplázala por tu código.

## Pista

Dentro del for necesitas dos if independientes (no elif, porque un número puede ser par y múltiplo de 7 a la vez). Uno suma n a suma_pares; el otro suma 1 a multiplos_7.
