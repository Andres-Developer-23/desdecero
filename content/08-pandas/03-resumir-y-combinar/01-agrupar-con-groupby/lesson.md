---
title: Agrupar y resumir con groupby
minutes: 18
summary: groupby() para resumir por grupos, agg() con varios resúmenes a la vez y pivot_table() para cruzar dos categorías.
---

«¿Cuánto vendió cada tienda?», «¿qué categoría deja más?», «¿cuál es el ticket medio por ciudad?». Todas son la misma operación: **agrupar** las filas por una columna y **resumir** cada grupo. Es lo que en SQL hace `GROUP BY`, y en pandas, `groupby()`.

### groupby: separar, calcular y juntar

`ventas.groupby("tienda")` separa las ventas en un grupo por tienda; después eliges una columna y un resumen, y pandas junta los resultados en una Series con la tienda como índice:

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
ventas["total"] = ventas["unidades"] * ventas["precio_unitario"]
print(ventas.groupby("tienda")["total"].sum())
print(ventas.groupby("tienda")["total"].mean().round())
print(ventas.groupby("tienda").size())
```

- Los resúmenes son los de siempre: `sum()`, `mean()`, `median()`, `min()`, `max()`, `count()` (valores que no son NaN) o `nunique()`.
- `size()` cuenta las filas de cada grupo.
- El resultado sale ordenado por el grupo (alfabéticamente); para ordenar por el valor, `sort_values()`.

### Varios resúmenes a la vez: agg

Con `agg()` y la forma `nombre=("columna", "resumen")` se crea una tabla con una columna por resumen, con los nombres que elijas:

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
ventas["total"] = ventas["unidades"] * ventas["precio_unitario"]
resumen = ventas.groupby("categoria").agg(
    ventas=("total", "size"),
    unidades=("unidades", "sum"),
    ingresos=("total", "sum"),
    venta_media=("total", "mean"),
)
resumen["venta_media"] = resumen["venta_media"].round().astype(int)
print(resumen.sort_values("ingresos", ascending=False))
```

Se puede agrupar por varias columnas con una lista, `groupby(["tienda", "categoria"])`: el resultado tiene un índice de dos niveles. `reset_index()` convierte los grupos otra vez en columnas normales, algo útil antes de guardar el resultado o de combinarlo con otra tabla.

### Tablas dinámicas: pivot_table

Para cruzar dos categorías (categorías en las filas y tiendas en las columnas, por ejemplo), `pivot_table()` hace la tabla dinámica de una hoja de cálculo:

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
tabla = pd.pivot_table(
    ventas,
    index="categoria",
    columns="tienda",
    values="unidades",
    aggfunc="sum",
    margins=True,
    margins_name="Total",
)
print(tabla)
```

- `index` son las filas; `columns`, las columnas; `values`, qué se resume, y `aggfunc`, cómo.
- `margins=True` añade los totales de cada fila y cada columna.
- Si alguna combinación no tiene datos, sale NaN; `fill_value=0` lo cambia por 0.

## Ejercicio

Haz el resumen por tienda en la variable `resumen`: una fila por tienda y estas columnas, en este orden:

- `ventas`: cuántas ventas hubo;
- `unidades`: las unidades vendidas;
- `ingresos`: la suma de los totales (unidades × precio unitario);
- `ticket_medio`: el total medio por venta, redondeado y como entero.

Ordénalo de la tienda con más ingresos a la que menos y escríbelo:

```txt
              ventas  unidades  ingresos  ticket_medio
tienda
Bogotá           111       273   1457300         13129
...
```

## Pista

Primero la columna `total`. Después `ventas.groupby("tienda").agg(ventas=("total", "size"), unidades=("unidades", "sum"), ingresos=("total", "sum"), ticket_medio=("total", "mean"))`. Para el ticket, `.round().astype(int)`, y para el orden, `sort_values("ingresos", ascending=False)`.
