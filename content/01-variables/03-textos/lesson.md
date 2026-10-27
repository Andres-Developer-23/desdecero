---
title: Trabajar con texto
minutes: 20
summary: f-strings, métodos de texto, len() y posiciones de cada carácter.
---

Los textos son de lo que más vas a manejar. La forma más cómoda de mezclar texto y variables es la **f-string**: pon una `f` delante de las comillas y escribe las variables entre llaves.

```py
nombre = "Andrés"
edad = 25
print(f"Me llamo {nombre} y tengo {edad} años")
print(f"El año que viene tendré {edad + 1}")
```

Dentro de las llaves cabe cualquier expresión. Para limitar los decimales, añade `:.2f` (dos decimales):

```py
precio = 19.999
print(f"Precio: {precio:.2f}")
```

Los textos tienen **métodos**: funciones que se llaman con un punto detrás del texto. Los más útiles:

```py
frase = "  Aprender Python  "
print(frase.strip())       # quita los espacios del principio y del final
print(frase.upper())       # MAYÚSCULAS
print(frase.lower())       # minúsculas
print(frase.replace("Python", "a programar"))
print(len(frase))          # cuántos caracteres tiene, espacios incluidos
```

Cada carácter tiene una posición que empieza en **0**. Con corchetes sacas un carácter o un trozo:

```py
lenguaje = "Python"
print(lenguaje[0])     # P
print(lenguaje[-1])    # n: los negativos cuentan desde el final
print(lenguaje[0:3])   # Pyt: desde la posición 0 hasta la 3, sin incluirla
```

Los métodos no cambian el texto original: devuelven uno nuevo. Si quieres conservar el cambio, guárdalo: `nombre = nombre.strip()`.

## Ejercicio

La variable `entrada` contiene un nombre mal escrito: `"   mARÍA gonzález  "`.

1. Quítale los espacios con `strip()` y pon en mayúscula la primera letra de cada palabra con `.title()`. Guarda el resultado en `nombre`.
2. Imprime con una f-string: `Hola, María González. Tu nombre tiene 14 caracteres.` Calcula los caracteres con `len()`.

## Pista

Puedes encadenar métodos: entrada.strip().title(). En la f-string pon {nombre} y {len(nombre)} entre llaves.
