---
title: Pedir datos con input()
minutes: 15
summary: Programas interactivos y por qué siempre hay que convertir lo que escribe el usuario.
---

Hasta ahora tus programas hacían siempre lo mismo. Con `input()` el programa se detiene, espera a que el usuario escriba algo y pulse Enter, y te devuelve lo que escribió.

```py
nombre = input("¿Cómo te llamas? ")
print(f"Encantado, {nombre}")
```

Al ejecutar el ejemplo aparece un campo en la consola para que escribas tu respuesta. El texto entre paréntesis es el mensaje que ve el usuario; deja un espacio al final para que no quede pegado a la respuesta.

Lo más importante de `input()`: **siempre devuelve texto**, aunque el usuario escriba un número. Si quieres hacer cuentas, conviértelo:

```py
anio = int(input("¿En qué año naciste? "))
print(f"En 2030 cumplirás {2030 - anio} años")
```

Si olvidas el `int()`, Python intentará restar un número y un texto y obtendrás un `TypeError`. Es uno de los errores más frecuentes al empezar, así que conviene reconocerlo a la primera.

## Ejercicio

Escribe un programa que pida **dos números enteros** con `input()` y muestre su suma con este formato exacto (si el usuario escribe 7 y 5):

```txt
La suma es 12
```

El comprobador lo probará con varios pares de números distintos. El código de partida tiene un error típico: ejecútalo con 7 y 5 para verlo.

## Pista

Ahora mismo a y b son textos, por eso "7" + "5" da "75". Envuelve cada input() en int().
