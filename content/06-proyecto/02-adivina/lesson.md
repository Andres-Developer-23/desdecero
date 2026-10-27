---
title: "Proyecto: adivina el número"
minutes: 30
summary: Un juego completo que combina input, bucles, condiciones, errores y funciones.
---

Es hora de juntarlo todo. Vas a programar el clásico juego de adivinar un número: el ordenador piensa un número del 1 al 100 y el jugador intenta adivinarlo. Después de cada intento, el programa le dice si el número secreto es más alto o más bajo.

Para que el ordenador elija un número al azar se usa el módulo `random`. Un **módulo** es un conjunto de funciones listas para usar que se cargan con `import`:

```py
import random

for _ in range(3):
    print(random.randint(1, 100))   # entero al azar entre 1 y 100, ambos incluidos
```

Ejecuta el ejemplo varias veces: cada vez salen números distintos. El guion bajo `_` es el nombre habitual para una variable cuyo valor no vas a usar.

Antes de escribir código, piensa el plan en pasos. Este hábito te servirá en cualquier programa:

1. Elegir el número secreto y poner el contador de intentos a cero.
2. Repetir hasta que el jugador acierte: pedir un número, sumar un intento y decir "más alto" o "más bajo".
3. Al acertar, felicitar e indicar cuántos intentos hicieron falta.

Para el paso 2 viene bien `while True:`, un bucle que no termina por sí solo: sales de él con `break` o, dentro de una función, con `return`.

Para que el comprobador pueda probar tu juego, el número secreto llega como parámetro de la función `jugar(secreto)`. Al comprobar se ignoran las llamadas a `jugar(...)` que escribas fuera de la función, así que puedes dejar activa la última línea para jugar de verdad.

## Ejercicio

Completa la función `jugar(secreto)`:

- Pide números con `input("Tu número: ")` hasta que el jugador acierte.
- Si el número es menor que el secreto, imprime `Más alto`. Si es mayor, `Más bajo`.
- Al acertar, imprime `¡Correcto! Intentos: N` y **devuelve** el número de intentos.
- Si el jugador escribe algo que no es un número entero, imprime `Escribe un número entero` y no cuentes ese intento.

## Pista

Usa while True: y sal con return intentos al acertar. Convierte con int() dentro de un try; en el except imprime el aviso y usa continue para pedir otro número sin sumar el intento.
