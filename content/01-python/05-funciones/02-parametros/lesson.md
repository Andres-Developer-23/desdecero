---
title: Parámetros por defecto y alcance
minutes: 20
summary: Valores por defecto, argumentos con nombre y por qué las variables de una función son locales.
---

Un parámetro puede tener un **valor por defecto**, que se usa cuando no le pasas ese argumento:

```py
def saludar(nombre, saludo="Hola"):
    return f"{saludo}, {nombre}"

print(saludar("Laura"))
print(saludar("Laura", "Buenos días"))
print(saludar(saludo="Qué más", nombre="Laura"))
```

En la última llamada se usan **argumentos con nombre**: indicas a qué parámetro va cada valor y el orden deja de importar. Es útil cuando una función tiene muchos parámetros. Los parámetros con valor por defecto van siempre después de los que no lo tienen.

Las variables que creas dentro de una función son **locales**: solo existen mientras la función se ejecuta. Fuera de ella no se pueden usar:

```py
def calcular():
    resultado = 42
    return resultado

valor = calcular()
print(valor)        # 42
print(resultado)    # NameError: resultado solo existía dentro
```

Por eso las funciones se comunican con el exterior a través de sus parámetros (lo que entra) y de su `return` (lo que sale). Si una función necesita un dato, pásaselo como argumento.

Para comprobar si algo **no** está en una colección existe `not in`: `"JPY" not in tasas` es `True` si esa clave no existe.

## Ejercicio

Escribe una función `convertir(cantidad, moneda="USD")` que pase pesos colombianos a otra moneda y devuelva el resultado **redondeado a 2 decimales** con `round(valor, 2)`. Usa estas tasas de ejemplo (pesos por unidad), que ya están en el código:

- `"USD"`: 4000
- `"EUR"`: 4400

Si la moneda no está en el diccionario, devuelve `None`.

## Pista

Primero comprueba if moneda not in tasas: y devuelve None. Si sigue, divide la cantidad entre tasas[moneda] y redondea con round(..., 2).
