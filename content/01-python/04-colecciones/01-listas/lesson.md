---
title: Listas
minutes: 20
summary: Crear listas, acceder por posición, añadir, ordenar y recorrerlas.
---

Una **lista** guarda varios valores en orden, entre corchetes y separados por comas:

```py
frutas = ["manzana", "pera", "mango"]
print(frutas)
print(frutas[0])     # manzana: las posiciones empiezan en 0
print(frutas[-1])    # mango: el último
print(len(frutas))   # 3
```

A diferencia de los textos, las listas se pueden **modificar**:

```py
frutas = ["manzana", "pera", "mango"]
frutas.append("uva")        # añade al final
frutas[1] = "kiwi"          # reemplaza la posición 1
frutas.remove("manzana")    # quita un elemento por su valor
print(frutas)
frutas.sort()               # ordena: alfabéticamente o de menor a mayor
print(frutas)
```

Con un `for` recorres todos los elementos, y hay funciones que trabajan directamente con listas de números:

```py
notas = [4.5, 3.0, 4.8, 2.9]
for nota in notas:
    print(f"Nota: {nota}")
print("Suma:", sum(notas))
print("Máxima:", max(notas), "Mínima:", min(notas))
print("Promedio:", sum(notas) / len(notas))
```

Para saber si un valor está en una lista, usa `in`: `"pera" in frutas` da `True` o `False`.

## Ejercicio

Tienes las temperaturas máximas de una semana en la lista `temps`. Imprime exactamente:

```txt
Promedio: 24.43
Máxima: 29
Días de más de 25°: 3
```

El promedio va con **dos decimales** (`:.2f`). Para el último dato, recorre la lista con un `for` y cuenta.

## Pista

El promedio es sum(temps) / len(temps). Para contar, crea calurosos = 0 antes del for y súmale 1 cuando t > 25.
