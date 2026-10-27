---
title: Tipos de datos y conversiones
minutes: 15
summary: int, float, str y bool; type() para preguntar el tipo; int(), float() y str() para convertir.
---

Cada valor en Python tiene un **tipo**, y el tipo decide qué puedes hacer con él. Los cuatro básicos:

- `int`: números enteros, como `42` o `-7`
- `float`: números con decimales, como `3.14` o `2.0`
- `str`: texto, siempre entre comillas, como `"hola"` o `"42"`
- `bool`: verdadero o falso; solo existen dos valores, `True` y `False`

La función `type()` te dice el tipo de cualquier valor:

```py
print(type(42))
print(type(3.14))
print(type("42"))
print(type(True))
```

Ojo con el tercero: `"42"` entre comillas es texto, no un número. Parece lo mismo, pero se comporta distinto:

```py
print(42 + 8)       # 50
print("42" + "8")   # 428: con textos, + los une
```

Para pasar de un tipo a otro se usan funciones con el nombre del tipo:

```py
texto = "25"
numero = int(texto)       # de texto a entero
print(numero + 5)         # 30
print(float("2.5") * 2)   # 5.0
print("Tengo " + str(30) + " años")   # de número a texto
```

`int()` solo funciona con textos que parecen un entero. `int("hola")` o `int("2.5")` producen un `ValueError`.

## Ejercicio

Tienes dos medidas que llegaron como texto: `ancho = "12"` y `alto = "3.5"`. Conviértelas al tipo numérico adecuado, guarda el área (`ancho * alto`) en una variable `area` y deja que la última línea imprima `Área: 42.0`.

## Pista

ancho es un entero, así que usa int(ancho). alto tiene decimales, así que necesita float(alto). Multiplica los dos.
