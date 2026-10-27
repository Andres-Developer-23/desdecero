---
title: Tu primer programa
minutes: 10
summary: print(), texto entre comillas y el orden en que Python ejecuta las líneas.
---

Un programa es una lista de instrucciones que el ordenador sigue en orden, de arriba abajo, una línea cada vez. En Python, la instrucción más básica es `print()`: muestra en pantalla lo que pongas entre los paréntesis.

```py
print("Hola, mundo")
print("Estoy aprendiendo Python")
```

Pulsa **ejecutar** en el ejemplo. Verás las dos líneas en el mismo orden en que están escritas.

El texto va entre comillas. Python acepta comillas dobles `"..."` o simples `'...'`, pero tienen que coincidir al abrir y al cerrar. A un texto entre comillas se le llama **string** (cadena de texto).

`print()` también acepta varios valores separados por comas. Los muestra en la misma línea, separados por un espacio. Y un `print()` vacío deja una línea en blanco:

```py
print("Tengo", 3, "gatos")
print()
print("La línea de arriba quedó vacía")
```

Tres detalles que conviene saber desde ya:

- Python distingue mayúsculas y minúsculas: `Print("hola")` da error.
- Cada `print()` termina con un salto de línea.
- Las líneas que empiezan con `#` son **comentarios**: Python las ignora. Sirven para explicar tu código a otras personas y a tu yo del futuro.

```py
# Esto es un comentario: no se ejecuta
print("Esto sí se ejecuta")  # también puedes comentar al final de una línea
```

## Ejercicio

Escribe un programa que imprima exactamente estas dos líneas:

```txt
Hola, mundo
Mi primer programa en Python
```

## Pista

Necesitas dos print(), uno por línea. Copia el texto tal cual, con la coma y la mayúscula de "Hola".
