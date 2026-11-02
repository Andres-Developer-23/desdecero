---
title: Series y DataFrame
minutes: 15
summary: "Qué es pandas y sus dos estructuras: la Series (una columna con índice) y el DataFrame (una tabla)."
---

**pandas** es la librería de Python para analizar datos: carga una tabla (de un CSV, un Excel, una base de datos…) y te deja filtrarla, calcular, agrupar y dibujarla con unas pocas líneas. Es la herramienta diaria de quien trabaja con datos, y por debajo usa **numpy**, que hace los cálculos a la velocidad de C.

Ni pandas ni numpy vienen con Python: en tu ordenador se instalan con `pip install pandas`. Aquí ya están: los programas de esta ruta se ejecutan con **Python completo** (Pyodide), así que la primera vez tardan unos segundos en cargar. Por costumbre, pandas se importa con el nombre corto `pd`.

### Series: una columna con índice

Una **Series** es una lista de valores del mismo tipo, cada uno con una etiqueta: su **índice**.

```py
import pandas as pd

precios = pd.Series([2500, 6500, 5500, 3000])
print(precios)
print(precios.sum(), precios.mean(), precios.max())
print(precios * 2)
```

- A la izquierda está el índice (0, 1, 2, 3) y abajo, el **tipo** de los datos: `int64` son enteros.
- `sum()`, `mean()` (la media), `max()`, `min()`… calculan sobre todos los valores.
- `precios * 2` multiplica **cada** valor, sin escribir un `for`: en pandas, las operaciones se aplican a la columna entera. Es más corto y mucho más rápido.

El índice puede tener etiquetas propias, y entonces se usa como un diccionario:

```py
import pandas as pd

precios = pd.Series([2500, 6500, 3000], index=["Tinto", "Capuchino", "Pandebono"])
print(precios)
print(precios["Capuchino"])
```

### DataFrame: una tabla

Un **DataFrame** es una tabla: varias columnas (cada una, una Series) que comparten el mismo índice. La forma más directa de crear uno es un diccionario con una lista por columna:

```py
import pandas as pd

menu = pd.DataFrame({
    "producto": ["Tinto", "Capuchino", "Chocolate", "Pandebono"],
    "precio": [2500, 6500, 5500, 3000],
    "vegano": [True, False, False, True],
})
print(menu)
print(menu.shape)
print(menu.columns.tolist())
print(menu.dtypes)
```

- `menu.shape` es una tupla con el número de filas y de columnas.
- `menu.columns` son los nombres de las columnas, y `menu.dtypes`, el tipo de cada una: `str` para los textos, `int64` para los enteros, `float64` para los decimales y `bool` para `True`/`False`.

### Trabajar con columnas

`menu["precio"]` es la columna `precio`, una Series con sus mismas operaciones. Y asignando a un nombre nuevo se crea una columna, calculada para todas las filas a la vez:

```py
import pandas as pd

menu = pd.DataFrame({
    "producto": ["Tinto", "Capuchino", "Chocolate"],
    "precio": [2500, 6500, 5500],
})
print(menu["precio"].mean())
menu["con_propina"] = menu["precio"] * 1.1
menu["doble"] = menu["precio"] * 2
print(menu)
```

Fíjate en que `con_propina` tiene decimales (`2750.0`): al multiplicar por `1.1`, la columna pasa a ser `float64`.

## Ejercicio

Con las listas del código de partida, crea el DataFrame `inventario` con las columnas `producto`, `precio` y `unidades`. Añádele la columna `valor` (precio × unidades) y escribe la tabla y un resumen:

```txt
    producto  precio  unidades   valor
0      Tinto    2500        40  100000
...
Unidades: 90
Valor total: 316000
Precio medio: 4500.0
```

## Pista

`pd.DataFrame({"producto": productos, "precio": precios, "unidades": unidades})` crea la tabla. La columna nueva es `inventario["precio"] * inventario["unidades"]`, y los totales salen de `sum()` y `mean()` sobre cada columna.
