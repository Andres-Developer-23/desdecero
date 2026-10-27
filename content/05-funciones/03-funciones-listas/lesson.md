---
title: Funciones que trabajan con listas
minutes: 20
summary: Recibir una colección, construir una lista nueva y devolverla.
---

Las funciones brillan cuando procesan colecciones. El patrón más común es: recibir una lista, crear una lista vacía, recorrer la original y añadir a la nueva lo que interese.

```py
def solo_largas(palabras, minimo=5):
    resultado = []
    for p in palabras:
        if len(p) >= minimo:
            resultado.append(p)
    return resultado

print(solo_largas(["sol", "montaña", "río", "océano"]))
print(solo_largas(["sol", "montaña", "río", "océano"], 7))
```

Este patrón es tan habitual que Python tiene una forma corta de escribirlo, la **comprensión de listas**. Hace lo mismo en una sola línea:

```py
palabras = ["sol", "montaña", "río", "océano"]
largas = [p for p in palabras if len(p) >= 5]
mayus = [p.upper() for p in palabras]
print(largas)
print(mayus)
```

Se lee casi en voz alta: "p, para cada p en palabras, si su longitud es al menos 5". Usa la forma que te resulte más clara; las dos son correctas.

`sorted()` también acepta un parámetro `key` para ordenar con otro criterio: `sorted(palabras, key=len)` ordena por longitud.

## Ejercicio

Escribe una función `aprobados(notas, minima=3.0)` que reciba un **diccionario** `{nombre: nota}` (en escala de 0 a 5) y devuelva una **lista ordenada alfabéticamente** con los nombres de quienes tienen una nota mayor o igual que `minima`.

## Pista

Recorre notas.items() para tener nombre y nota a la vez, añade a una lista los que cumplan nota >= minima y devuelve sorted(lista).
