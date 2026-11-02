---
title: Adivina el número
level: principiante
tags: [Juegos, Bucles]
minutes: 45
runtime: python
requires: python
file: adivina.py
summary: "El clásico juego de adivinar un número, con niveles de dificultad, pistas, varias partidas y récords."
---

El ordenador piensa un número del 1 al 100 y tú tienes que adivinarlo con pocos intentos. Después de cada intento, el programa te dice si el número es mayor o menor. Parece sencillo, pero un buen juego de terminal tiene muchos detalles: elegir la dificultad, no romperse si escribes cualquier cosa, dar una pista, jugar otra vez y recordar tu mejor marca.

Es el proyecto perfecto para practicar **bucles**, **condiciones**, **funciones** y la entrada de datos con `input()`.

### Requisitos

- Al empezar, el programa da la bienvenida y pide elegir una **dificultad**, que decide cuántos intentos hay: fácil (10), media (5) o difícil (3). Si eliges una opción que no existe, vuelve a preguntar.
- El número secreto se elige al azar con `random.randint(1, 100)`.
- En cada intento, dice si acertaste o si el número es **mayor** o **menor** que el que escribiste.
- Si escribes algo que no es un número del 1 al 100, lo explica y vuelve a preguntar, **sin gastar un intento**.
- Una vez por partida puedes escribir `pista` para saber si el número es par o impar. Tampoco gasta un intento.
- Si se acaban los intentos, dice cuál era el número.
- Al terminar una partida, pregunta si quieres jugar otra.
- Guarda el **récord** (el menor número de intentos) de cada dificultad mientras juegas, y avisa cuando lo superas.

### Ejemplo

```txt
¡Bienvenido al juego de adivinar el número!
Estoy pensando en un número del 1 al 100.

Elige la dificultad:
1. Fácil (10 intentos)
2. Media (5 intentos)
3. Difícil (3 intentos)
Tu elección: 2
Dificultad media: tienes 5 intentos.

Intento 1: 50
Incorrecto: el número es menor que 50.
Intento 2: pista
Pista: es un número par.
Intento 2: 25
Incorrecto: el número es mayor que 25.
Intento 3: cuarenta
Escribe un número del 1 al 100 (o «pista»).
Intento 3: 42
¡Correcto! Lo adivinaste en 3 intentos.
Nuevo récord en dificultad media: 3 intentos.

¿Otra partida? (s/n): n
¡Gracias por jugar!
```

### Cómo empezar

Piensa primero en las piezas y escribe una función para cada una:

- `elegir_dificultad()` enseña el menú, pregunta hasta que la respuesta sea válida y devuelve el nombre de la dificultad y sus intentos. Un diccionario como `{"1": ("fácil", 10), ...}` guarda las opciones.
- `jugar_partida()` juega una partida entera y devuelve cuántos intentos usaste si ganaste, o `None` si perdiste.
- `main()` repite partidas mientras quieras seguir jugando y lleva los récords en un diccionario.

Para pedir un número sin que el programa se rompa, comprueba el texto antes de convertirlo: `texto.isdigit()` dice si son solo cifras. Y un bucle `while` que solo avanza el contador de intentos cuando el intento cuenta resuelve lo de no gastar intentos con las respuestas inválidas y la pista.

Ojo con las palabras en singular: «1 intento», pero «3 intentos».

### Para ir más allá

Añade un cronómetro que diga cuánto tardaste (`time.time()` al empezar y al acabar), guarda los récords en un archivo JSON para que duren entre ejecuciones, o dale la vuelta al juego: piensa tú un número y que el ordenador lo adivine en el menor número de intentos posible (pista: búsqueda binaria).

## Objetivo

Escribe el juego completo en `adivina.py`. Las comprobaciones juegan varias partidas con respuestas fijas, con el número secreto preparado (`random.randint` devuelve los números que elige la prueba), y buscan estos mensajes en la salida:

- `Dificultad media: tienes 5 intentos.` (y lo mismo con fácil y difícil) y `Elige 1, 2 o 3.` si la opción no existe.
- `Incorrecto: el número es menor que 50.` y `Incorrecto: el número es mayor que 25.`
- `Escribe un número del 1 al 100` cuando la respuesta no es válida.
- `Pista: es un número impar.` (o par) y `Ya usaste tu pista en esta partida.` la segunda vez.
- `¡Correcto! Lo adivinaste en 3 intentos.` (en singular si es 1 intento).
- `Te quedaste sin intentos. El número era 7.`
- `Nuevo récord en dificultad fácil: 1 intento.` cuando mejoras el récord de esa dificultad.
- `¡Gracias por jugar!` al terminar.

La pregunta para jugar otra vez acepta `s` para seguir; cualquier otra respuesta termina.

## Pista

La forma del bucle de una partida puede ser esta: mientras `intento <= maximo`, pide una respuesta; si es la pista, contéstala y vuelve a preguntar con `continue` sin sumar al intento; si acierta, devuelve `intento`; si no, di si es mayor o menor y suma 1. Si el bucle termina, se acabaron los intentos.

Para que la pista solo funcione una vez, guarda en una variable `pista_usada = False` y cámbiala a `True` al darla. `secreto % 2 == 0` dice si un número es par.

Para el récord, comprueba `nombre not in records or intentos < records[nombre]` antes de guardarlo.

## Solución

En la solución de referencia, `leer_numero` se encarga de que la respuesta sea válida: repite la pregunta hasta tener un número del 1 al 100 o la palabra «pista». Así, `jugar_partida` solo tiene que decidir qué hacer con una respuesta que ya sabe que es correcta, y el código de cada función es corto y fácil de leer.

`jugar_partida` devuelve una tupla `(dificultad, intentos)` si ganas y `None` si pierdes, y `main` usa ese resultado para los récords. Separar el juego de los récords permite cambiar uno sin tocar el otro: por ejemplo, guardar los récords en un archivo solo cambiaría `main`.
