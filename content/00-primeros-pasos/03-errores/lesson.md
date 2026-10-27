---
title: Leer los errores sin miedo
minutes: 15
summary: Qué dice un mensaje de error, cómo encontrar la línea y los tres errores más comunes.
---

Un error no significa que lo estés haciendo mal: es la forma que tiene Python de decirte exactamente qué no entendió. Programar es, en buena parte, leer errores y corregirlos.

Un mensaje de error tiene dos partes que importan: **el tipo de error** y **la línea** donde ocurrió. Ejecuta este ejemplo:

```py
print("Esta línea funciona")
print(mensaje)
```

Python ejecuta la primera línea y se detiene en la segunda con un `NameError`: está usando un nombre, `mensaje`, que nadie ha definido. La primera línea sí llegó a imprimirse.

Los tres errores que más vas a ver al empezar:

- `SyntaxError`: el código está mal escrito y Python no puede leerlo. Suele ser una comilla o un paréntesis sin cerrar, o que faltan los dos puntos `:` al final de un `if` o un `for`. Con este error no se ejecuta ninguna línea.
- `NameError`: usas un nombre que no existe. Casi siempre es una errata (`pritn` en lugar de `print`) o una variable que todavía no has creado.
- `TypeError`: mezclas tipos de datos que no encajan, como sumar un texto y un número.

```py
print("Tengo " + 30 + " años")
```

Cuando veas un error, sigue siempre los mismos pasos: lee el tipo, ve a la línea indicada (el editor la marca en rojo) y revisa también la línea anterior, porque muchas veces el problema empieza ahí.

## Ejercicio

Este programa tiene **tres errores**, uno en cada línea. Corrígelos para que imprima:

```txt
Bienvenida al curso
Lecciones: 20
Python 3
```

## Pista

Línea 1: falta cerrar una comilla. Línea 2: revisa cómo está escrito print. Línea 3: no se puede sumar texto y número; pon el 3 entre comillas o usa una coma en lugar de +.
