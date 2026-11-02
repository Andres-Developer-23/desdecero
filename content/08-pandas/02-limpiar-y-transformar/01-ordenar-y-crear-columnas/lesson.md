---
title: Ordenar y crear columnas
minutes: 16
summary: Columnas calculadas, sort_values() y nlargest() para ordenar, y apply() y map() para transformar valor a valor.
---

La tabla de ventas tiene las unidades y el precio, pero no el total de cada venta. Calcularlo es una línea, y con él ya se puede ordenar.

### Columnas calculadas

Las operaciones entre columnas se hacen fila a fila, para toda la tabla a la vez:

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
ventas["total"] = ventas["unidades"] * ventas["precio_unitario"]
ventas["total_miles"] = (ventas["total"] / 1000).round(1)
print(ventas[["producto", "unidades", "precio_unitario", "total", "total_miles"]].head())
```

- `/` siempre da decimales (`float64`), y `round(1)` redondea a una cifra decimal.
- Para cambiar el nombre de columnas, `rename(columns={"viejo": "nuevo"})`; para quitarlas, `drop(columns=[...])`. Las dos devuelven una tabla **nueva**: hay que guardarla (`ventas = ventas.drop(...)`).

### Ordenar

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
ventas["total"] = ventas["unidades"] * ventas["precio_unitario"]
columnas = ["fecha", "tienda", "producto", "total"]
print(ventas.sort_values("total", ascending=False, kind="stable")[columnas].head(3))
print(ventas.sort_values(["tienda", "total"], ascending=[True, False])[columnas].head(3))
print(ventas.nsmallest(3, "total")[["producto", "total"]])
```

- `sort_values("total")` ordena de menor a mayor; con `ascending=False`, de mayor a menor.
- Con una lista de columnas, ordena por la primera y desempata con las siguientes, cada una en su sentido.
- `nlargest(n, columna)` y `nsmallest(n, columna)` son atajos para «los n mayores» y «los n menores».
- Al ordenar, cada fila conserva su índice: por eso los números de la izquierda salen desordenados. Si molestan, `reset_index(drop=True)` los vuelve a numerar.
- Si hay empates, el orden de las filas empatadas no está garantizado y puede cambiar de un ordenador a otro. Con `kind="stable"`, las empatadas quedan en su orden original (aquí, las tres ventas de 57000).

### Transformar valor a valor

Cuando la regla no es una operación aritmética, `apply()` llama a una función tuya con cada valor de la columna, y `map()` traduce cada valor con un diccionario:

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
ventas["total"] = ventas["unidades"] * ventas["precio_unitario"]


def tamano(total):
    if total >= 30000:
        return "grande"
    if total >= 10000:
        return "mediana"
    return "pequeña"


ventas["tamano"] = ventas["total"].apply(tamano)
ventas["codigo"] = ventas["tienda"].map({"Bogotá": "BOG", "Medellín": "MED", "Cali": "CLO", "Barranquilla": "BAQ"})
print(ventas[["tienda", "codigo", "total", "tamano"]].head())
print(ventas["tamano"].value_counts())
```

`apply()` es cómodo, pero llama a Python una vez por fila, así que es más lento que las operaciones de columna: úsalo solo cuando no haya una operación de pandas que haga lo mismo.

## Ejercicio

Añade a las ventas la columna `total` (unidades × precio unitario) y la columna `tamano`: `"grande"` si el total es de 30000 o más, y `"normal"` si no. Escribe las 5 ventas de mayor total (con su fecha, tienda, producto y total) y cuántas ventas hay de cada tamaño:

```txt
          fecha        tienda          producto  total
44   2026-01-26  Barranquilla       Café frappé  57000
...
tamano
normal    ...
grande    ...
Name: count, dtype: int64
```

## Pista

Para el tamaño, una función que reciba un total y devuelva el texto, y `ventas["total"].apply(función)`. Las 5 mayores: `ventas.nlargest(5, "total")` y después las columnas, o `sort_values("total", ascending=False).head(5)`.
