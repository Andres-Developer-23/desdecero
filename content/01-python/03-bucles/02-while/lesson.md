---
title: El bucle while
minutes: 15
summary: Repetir mientras se cumpla una condición, y cómo evitar los bucles infinitos.
---

`while` repite un bloque **mientras** una condición sea verdadera. Se usa cuando no sabes de antemano cuántas vueltas harán falta.

```py
saldo = 100
mes = 0
while saldo > 0:
    saldo = saldo - 30
    mes = mes + 1
print(f"El dinero se acaba en el mes {mes}")
```

En cada vuelta Python vuelve a comprobar la condición. Si nunca deja de cumplirse, el bucle no termina: es un **bucle infinito**. Para evitarlo, asegúrate de que algo dentro del bucle acerque la condición a `False` (aquí, restar del saldo). Si te pasa en este editor, no pasa nada: el programa se detiene solo a los pocos segundos, o puedes pulsar **detener**.

Un uso típico de `while` es repetir una pregunta hasta que la respuesta sea válida:

```py
clave = ""
while clave != "python":
    clave = input("Contraseña: ")
print("Acceso concedido")
```

Dos instrucciones funcionan en cualquier bucle, `for` o `while`:

- `break` sale del bucle inmediatamente.
- `continue` salta al principio de la vuelta siguiente.

## Ejercicio

Pide un número entero positivo y haz una **cuenta atrás** con `while` hasta 1. Al final imprime `¡Despegue!`. Con 3, la salida debe ser:

```txt
3
2
1
¡Despegue!
```

## Pista

La condición es while n > 0:. Dentro, imprime n y réstale 1 (n -= 1). El print del despegue va fuera del bucle, sin sangría.
