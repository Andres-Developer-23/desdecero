---
title: Filtrar con condiciones
minutes: 17
summary: Máscaras de True y False para quedarse con las filas que cumplen una condición; &, |, ~, isin(), between() y str.contains().
---

Filtrar es quedarse con las filas que cumplen una condición: las ventas de Cali, las de más de 3 unidades, las de café. En pandas se hace en dos pasos.

### Una máscara de True y False

Comparar una columna con un valor no da un solo `True` o `False`: da una **Series de booleanos**, uno por fila. Esa Series se llama **máscara**, y al ponerla entre corchetes, el DataFrame se queda con las filas donde vale `True`:

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
grandes = ventas["unidades"] >= 5
print(grandes.head())
print(grandes.sum(), "ventas de 5 unidades o más")
print(ventas[grandes][["fecha", "tienda", "producto", "unidades"]].head())
```

Como `True` cuenta como 1, `máscara.sum()` dice cuántas filas la cumplen, y `máscara.mean()`, qué proporción.

### Combinar condiciones

Para combinar condiciones, pandas usa símbolos en lugar de palabras: `&` (y), `|` (o) y `~` (no). **Cada condición va entre paréntesis**, porque `&` se evalúa antes que `>=` o `==`:

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
cali_frias = ventas[(ventas["tienda"] == "Cali") & (ventas["categoria"] == "Bebidas frías")]
print(len(cali_frias), "ventas de bebidas frías en Cali")
no_bogota = ventas[~(ventas["tienda"] == "Bogotá")]
print(no_bogota["tienda"].unique())
```

Con `and` y `or` de Python, pandas da un error: `The truth value of a Series is ambiguous`. No sabe si quieres que todas las filas lo cumplan o solo alguna.

### Atajos útiles

- `isin([...])`: el valor está en una lista. Más corto que encadenar `|`.
- `between(a, b)`: entre dos valores, los dos incluidos.
- Para textos, `.str.contains("café", case=False)` (contiene, sin distinguir mayúsculas), `.str.startswith(...)` y `.str.endswith(...)`.

### Filtrar y elegir columnas a la vez

`loc` acepta una máscara para las filas y una lista para las columnas: `df.loc[máscara, columnas]`.

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
cafe = ventas["producto"].str.contains("café", case=False)
muchas = ventas["unidades"].between(4, 6)
print(ventas.loc[cafe & muchas, ["fecha", "tienda", "producto", "unidades"]].head())
calientes = ventas["categoria"].isin(["Bebidas calientes"])
print(ventas.loc[calientes & ventas["tienda"].isin(["Cali", "Medellín"]), "unidades"].sum())
```

Una forma alternativa de escribir filtros es `ventas.query("unidades >= 5 and tienda == 'Cali'")`: un texto que pandas interpreta, donde sí se usan `and` y `or`. Es cómoda, pero los errores de escritura se descubren más tarde.

## Ejercicio

El encargado de la tienda de **Medellín** quiere ver las ventas grandes de **postres**: las de la categoría `Postres` con 3 unidades o más. Escribe su fecha, el producto y las unidades, y una línea final con cuántas ventas son y cuántas unidades suman:

```txt
          fecha            producto  unidades
102  2026-03-04  Torta de zanahoria         3
...
9 ventas, 33 unidades
```

## Pista

La máscara tiene tres condiciones: `(ventas["tienda"] == "Medellín") & (ventas["categoria"] == "Postres") & (ventas["unidades"] >= 3)`. Después, `ventas.loc[máscara, ["fecha", "producto", "unidades"]]`. El número de ventas es `len(...)` del resultado.
