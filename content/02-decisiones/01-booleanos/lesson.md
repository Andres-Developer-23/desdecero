---
title: Comparaciones y lógica
minutes: 15
summary: "==, !=, <, >, and, or y not: preguntas que se responden con True o False."
---

Para tomar decisiones, un programa necesita hacerse preguntas de sí o no. En Python esas preguntas son **comparaciones**, y su respuesta es un `bool`: `True` o `False`.

```py
edad = 17
print(edad >= 18)        # False
print(edad == 17)        # True
print(edad != 17)        # False
print("hola" == "Hola")  # False: las mayúsculas cuentan
```

Los operadores de comparación:

- `==` igual a (dos signos; uno solo es asignar)
- `!=` distinto de
- `<` menor, `>` mayor, `<=` menor o igual, `>=` mayor o igual

Para combinar varias preguntas se usan tres palabras:

- `and`: es True solo si **las dos** partes son True
- `or`: es True si **al menos una** parte es True
- `not`: invierte el resultado

```py
edad = 25
tiene_entrada = True
print(edad >= 18 and tiene_entrada)   # True
print(edad < 12 or edad > 65)         # False
print(not tiene_entrada)              # False
```

El resultado de una comparación se puede guardar en una variable, como cualquier otro valor. Así el código se lee casi como una frase: `puede_entrar = edad >= 18 and tiene_entrada`.

## Ejercicio

Un parque de atracciones deja subir a la montaña rusa a quien mide **al menos 140 cm** y tiene **al menos 10 años**, o a quien vaya **acompañado de un adulto** y mida **al menos 120 cm**.

Completa `puede_subir` con una sola expresión que use `altura`, `edad` y `con_adulto`. El comprobador probará cinco visitantes distintos.

## Pista

Escribe las dos condiciones entre paréntesis y únelas con or: (altura >= 140 and edad >= 10) or (con_adulto and altura >= 120).
