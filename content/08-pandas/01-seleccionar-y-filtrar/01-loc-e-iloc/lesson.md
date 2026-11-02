---
title: "Columnas y filas: loc e iloc"
minutes: 16
summary: Elegir columnas con corchetes y filas con loc (por etiqueta) e iloc (por posición), y un índice con sentido con set_index().
---

Casi todo análisis empieza quedándose con una parte de la tabla: unas columnas, unas filas o un valor concreto.

### Columnas

- `df["precio"]` es una columna: una **Series**.
- `df[["producto", "precio"]]`, con una **lista** de nombres (por eso los dobles corchetes), es un DataFrame con esas columnas, en ese orden.

```py
import pandas as pd

productos = pd.read_csv("productos.csv")
print(productos[["producto", "precio"]])
print(type(productos["precio"]).__name__, type(productos[["precio"]]).__name__)
```

### Filas por posición: iloc

`iloc` elige filas (y columnas) por su **posición**, empezando en 0, como las listas de Python:

- `df.iloc[0]` es la primera fila (como una Series) y `df.iloc[-1]`, la última;
- `df.iloc[2:5]` son las filas 2, 3 y 4 (el final no se incluye, como en las listas);
- `df.iloc[0:3, 0:2]`: filas y columnas, separadas por una coma.

### Filas por etiqueta: loc

`loc` elige por la **etiqueta** del índice. Con el índice por defecto (0, 1, 2…) las etiquetas son números y parece lo mismo que `iloc`, pero no lo es: en `loc` el final de un rango **sí** se incluye. Donde `loc` brilla es con un índice que tenga sentido, como el nombre del producto. `set_index("producto")` convierte esa columna en el índice:

```py
import pandas as pd

productos = pd.read_csv("productos.csv").set_index("producto")
print(productos)
print(productos.loc["Capuchino"])
print(productos.loc["Capuchino", "precio"])
print(productos.loc[["Tinto", "Brownie"], ["precio", "costo"]])
print(productos.loc["Pandebono":"Brownie", "precio"])
```

- `loc[fila, columna]` da un solo valor; con listas, una tabla más pequeña.
- `"Pandebono":"Brownie"` es un rango de etiquetas, en el orden de la tabla, con los dos extremos incluidos.
- `reset_index()` hace lo contrario de `set_index()`: el índice vuelve a ser una columna.

### Posición o etiqueta

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
print(ventas.iloc[0:3, [0, 1, 4]])
print(ventas.loc[0:3, ["fecha", "tienda", "unidades"]])
print(ventas.iloc[-1]["producto"])
```

Mismas filas pedidas «de 0 a 3», pero `iloc` devuelve 3 y `loc`, 4. Regla práctica: `loc` cuando sabes **qué** quieres (un producto, una columna por su nombre); `iloc` cuando sabes **dónde** está (la primera fila, las cinco últimas).

## Ejercicio

Lee `productos.csv` con el nombre del producto como índice y escribe:

1. el precio del **Capuchino**, con `loc`;
2. el precio y el costo de los productos desde **Pandebono** hasta **Brownie** (los dos incluidos), con `loc`;
3. las tres primeras filas, con `iloc`;
4. la categoría del último producto de la tabla, con `iloc`.

```txt
Precio del capuchino: 6500
            precio  costo
producto
Pandebono     3000   1100
...
```

## Pista

`pd.read_csv("productos.csv").set_index("producto")` pone el índice. Después: `productos.loc["Capuchino", "precio"]`, `productos.loc["Pandebono":"Brownie", ["precio", "costo"]]`, `productos.iloc[0:3]` y `productos.iloc[-1]["categoria"]`.
