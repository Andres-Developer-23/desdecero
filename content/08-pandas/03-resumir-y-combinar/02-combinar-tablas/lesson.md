---
title: "Combinar tablas: merge y concat"
minutes: 17
summary: merge() para unir tablas por una columna común (como un JOIN de SQL) y concat() para apilarlas.
---

Las ventas dicen cuánto se cobró, pero no cuánto costó: el costo de cada producto está en otra tabla, `productos.csv`. Para calcular la ganancia hay que **combinar** las dos, igual que un `JOIN` en SQL.

### merge: unir por una columna común

`pd.merge(izquierda, derecha, on="columna")` junta cada fila de la izquierda con la fila de la derecha que tiene el mismo valor en esa columna:

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
productos = pd.read_csv("productos.csv")
completas = pd.merge(ventas, productos[["producto", "costo"]], on="producto", how="left")
print(completas[["producto", "unidades", "precio_unitario", "costo"]].head())
print(ventas.shape, completas.shape)
```

- Elige de la otra tabla solo las columnas que necesitas, más la de unión: si las dos tablas tienen otra columna con el mismo nombre (aquí, `categoria`), pandas las renombra `categoria_x` y `categoria_y`.
- `how` dice qué filas se quedan: `"inner"` (por defecto) solo las que encuentran pareja; `"left"`, todas las de la izquierda (con NaN si no la encuentran); `"right"` y `"outer"`, las de la derecha o todas.
- Si las columnas se llaman distinto en cada tabla, `left_on="nombre"` y `right_on="producto"`.
- `validate="many_to_one"` comprueba que en la derecha no haya productos repetidos: si los hubiera, cada venta se duplicaría sin avisar.

### Encontrar lo que no encaja

Con `indicator=True`, el resultado tiene una columna `_merge` que dice de dónde salió cada fila: así se ven los productos que nunca se vendieron, o las ventas de productos que no están en el catálogo.

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
catalogo = pd.DataFrame({"producto": ["Tinto", "Capuchino", "Té chai"], "costo": [700, 2100, 1500]})
cruce = pd.merge(catalogo, ventas[["producto"]].drop_duplicates(), on="producto", how="left", indicator=True)
print(cruce)
```

### concat: apilar tablas

`pd.concat([tabla1, tabla2])` pone una tabla debajo de la otra (las mismas columnas, más filas), por ejemplo, las ventas de dos semestres o de varios archivos:

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
enero = ventas[ventas["fecha"].str.startswith("2026-01")]
junio = ventas[ventas["fecha"].str.startswith("2026-06")]
dos_meses = pd.concat([enero, junio], ignore_index=True)
print(len(enero), len(junio), len(dos_meses))
print(dos_meses[["fecha", "tienda", "producto"]].tail(3))
```

`ignore_index=True` numera de nuevo las filas; sin él, se conservan los índices de cada tabla y se repiten.

## Ejercicio

Calcula la ganancia de cada categoría. Combina las ventas con el costo de cada producto, y para cada venta calcula los ingresos (unidades × precio unitario), el costo (unidades × costo) y la ganancia (ingresos − costo). Después, en la variable `por_categoria`, la suma de ingresos, costo y ganancia de cada categoría, y el `margen`: la ganancia en porcentaje de los ingresos, con una cifra decimal. Ordénalo de la categoría que más gana a la que menos:

```txt
                   ingresos   costo  ganancia  margen
categoria
Bebidas frías       1743500  674000   1069500    61.3
...
```

## Pista

`pd.merge(ventas, productos[["producto", "costo"]], on="producto")` añade el costo. Calcula las tres columnas por venta y agrupa: `groupby("categoria")[["ingresos", "costo", "ganancia"]].sum()`. El margen es `(por_categoria["ganancia"] / por_categoria["ingresos"] * 100).round(1)`.
