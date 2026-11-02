---
title: Leer y explorar un CSV
minutes: 16
summary: pd.read_csv() para cargar un archivo, y head(), shape, dtypes, describe() y value_counts() para conocer los datos.
---

Los datos casi nunca se escriben a mano: vienen en archivos. El formato más común es el **CSV**: texto con una fila por línea y los valores separados por comas, con los nombres de las columnas en la primera línea. Así empieza `ventas.csv`, las ventas de la primera mitad de 2026 de **Café Andino**, una cadena (inventada) de cafeterías con tiendas en cuatro ciudades:

```txt
fecha,tienda,producto,categoria,unidades,precio_unitario
2026-01-03,Cali,Pandebono,Panadería,3,3000
2026-01-03,Medellín,Limonada de coco,Bebidas frías,1,8000
2026-01-03,Medellín,Pandebono,Panadería,1,3000
```

En esta ruta, tus programas tienen en su carpeta tres archivos de práctica: `ventas.csv`, `productos.csv` (el catálogo, con el precio y el costo de cada producto) y `encuesta.csv` (una encuesta a los clientes, con datos por limpiar). Como en tu ordenador, se leen por su nombre.

### Leer el archivo

`pd.read_csv()` lee el archivo y devuelve un DataFrame. Lo primero es echar un vistazo:

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
print(ventas.head())
print(ventas.shape)
print(ventas.dtypes)
```

- `head()` enseña las 5 primeras filas (`head(10)`, las 10 primeras) y `tail()`, las últimas. Con tablas grandes, `print(ventas)` enseña solo el principio y el final, con `...` en medio.
- Las columnas del medio también salen como `...`: cuando pandas no escribe en una terminal (en un archivo, o aquí), usa un ancho de 80 caracteres y esconde las columnas que no caben. Para verlas todas, `pd.set_option("display.max_columns", None)`: la tabla se parte en bloques, con una `\` al final de las líneas que siguen debajo. Otra opción es enseñar solo las columnas que te interesan, como verás en la próxima lección.
- `read_csv` adivina el tipo de cada columna: `unidades` y `precio_unitario` son enteros, y el resto, texto. Las fechas también quedan como texto; en otra lección verás cómo convertirlas.
- `ventas.info()` resume en una sola salida las columnas, sus tipos y cuántos valores tiene cada una. (Su última línea, la memoria que ocupa la tabla, cambia de un ordenador a otro.)

### Resumir los números y contar las categorías

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
print(ventas.describe())
print(ventas["tienda"].value_counts())
print(ventas["producto"].nunique(), "productos distintos")
print(sorted(ventas["categoria"].unique()))
```

- `describe()` resume cada columna numérica: cuántos valores hay (`count`), la media (`mean`), la desviación estándar (`std`, cuánto se separan de la media), el mínimo, los cuartiles (25 %, 50 % —la mediana— y 75 %) y el máximo.
- `value_counts()` cuenta cuántas veces aparece cada valor, de más a menos. Con `normalize=True`, en proporción.
- `unique()` da los valores distintos y `nunique()`, cuántos son.

Explorar así es siempre el primer paso de un análisis: antes de calcular nada, comprueba qué columnas hay, de qué tipo son y si los valores tienen sentido.

## Ejercicio

Lee `ventas.csv` y escribe este resumen: el tamaño de la tabla, las categorías de producto en orden alfabético, cuántas ventas hay de cada categoría (con `value_counts()`) y las unidades vendidas en total.

```txt
320 ventas y 6 columnas
Categorías: Bebidas calientes, Bebidas frías, Panadería, Postres
categoria
Bebidas calientes    ...
...
Unidades vendidas: 814
```

## Pista

`ventas.shape` es una tupla `(filas, columnas)`. Para las categorías, `sorted(ventas["categoria"].unique())` y `", ".join(...)`. El total de unidades es `ventas["unidades"].sum()`.
