---
title: Tuplas y conjuntos
minutes: 15
summary: Datos que no cambian y colecciones sin repetidos.
---

Además de listas y diccionarios, Python tiene otras dos colecciones que verás a menudo.

Una **tupla** es como una lista que no se puede modificar después de crearla. Se escribe con paréntesis y sirve para datos que van juntos y no deberían cambiar, como unas coordenadas:

```py
punto = (4, 7)
x, y = punto          # desempaquetar: cada valor a su variable
print(f"x vale {x} e y vale {y}")
```

Un **conjunto** (`set`) guarda valores **sin repetidos y sin orden**. Es la forma más rápida de eliminar duplicados o de comparar grupos:

```py
visitas = ["ana", "luis", "ana", "sofía", "luis", "ana"]
unicos = set(visitas)
print(f"{len(visitas)} visitas de {len(unicos)} personas distintas")
```

Los conjuntos permiten operaciones de teoría de conjuntos:

```py
python = {"ana", "luis", "marta"}
sql = {"luis", "marta", "pedro"}
print(sorted(python & sql))   # en los dos grupos
print(sorted(python | sql))   # en al menos uno
print(sorted(python - sql))   # solo en python
```

Como un conjunto no tiene orden, para mostrarlo ordenado se usa `sorted()`, que siempre devuelve una lista.

## Ejercicio

Dos cursos tienen sus listas de inscritos, con algunos nombres repetidos. Usa conjuntos para imprimir exactamente:

```txt
En ambos cursos: ['luis', 'marta']
Personas distintas: 6
```

La lista debe salir ordenada alfabéticamente (usa `sorted()`).

## Pista

Convierte cada lista con set(). Los que están en ambos son a & b; todas las personas son a | b. Ordena con sorted() y cuenta con len().
