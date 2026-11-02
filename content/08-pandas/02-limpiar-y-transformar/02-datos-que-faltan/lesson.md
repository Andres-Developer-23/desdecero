---
title: Datos que faltan y tipos
minutes: 18
summary: NaN, isna(), dropna() y fillna(); convertir tipos con astype() y pd.to_numeric(); y quitar filas repetidas.
---

Los datos reales vienen sucios: celdas vacías, números escritos como texto, filas repetidas. Antes de analizar nada hay que **limpiarlos**, y esa suele ser la parte más larga del trabajo. `encuesta.csv` es una encuesta de satisfacción de Café Andino que llegó así:

```txt
id,fecha,ciudad,edad,puntuacion,recomienda,comentario
1,02/05/2026, Bogotá ,20,5,Sí,El pandebono estaba frío
2,08/03/2026,Bogotá,44,2,sí,Muy buen café
3,22/04/2026,barranquilla,,3,si,Muy buen café
```

### Valores que faltan: NaN

Una celda vacía se lee como **NaN** (*Not a Number*), el «valor que falta» de pandas, como `NULL` en SQL. Los cálculos lo ignoran (`mean()` hace la media de los que hay) y se encuentra con `isna()`:

```py
import pandas as pd

encuesta = pd.read_csv("encuesta.csv")
print(encuesta.dtypes)
print(encuesta.isna().sum())
print(encuesta[encuesta["edad"].isna()][["id", "ciudad", "edad"]])
```

Fíjate en el tipo de `edad`: `float64`, aunque todas las edades son enteras. NaN es un valor decimal, así que una columna de enteros con huecos pasa a ser de decimales.

Con los huecos hay tres opciones, según el caso:

- **quitar** las filas: `dropna()` quita las que tienen algún NaN, y `dropna(subset=["puntuacion"])`, las que no tienen puntuación;
- **rellenar**: `fillna(0)`, o con un valor representativo como la mediana, `fillna(encuesta["edad"].median())`;
- **dejarlos**, si el análisis no necesita esa columna. Quitar filas de más también es perder datos.

### Tipos equivocados

La columna `puntuacion` debería ser numérica, pero es texto: alguien escribió `4 estrellas`. Convertirla con `astype(int)` daría un error; `pd.to_numeric(..., errors="coerce")` convierte lo que puede y deja NaN en lo que no:

```py
import pandas as pd

encuesta = pd.read_csv("encuesta.csv")
print(encuesta["puntuacion"].unique())
puntuacion = pd.to_numeric(encuesta["puntuacion"], errors="coerce")
print(puntuacion.isna().sum(), "puntuaciones no válidas")
print(round(puntuacion.mean(), 2))
edad = encuesta["edad"].fillna(encuesta["edad"].median()).astype(int)
print(edad.head().tolist())
```

`astype(int)` convierte una columna a enteros, y solo funciona si no queda ningún NaN: por eso va después de `fillna()`.

### Filas repetidas

Si una respuesta se envió dos veces, cuenta doble. `duplicated()` marca las filas iguales a una anterior, y `drop_duplicates()` las quita (con `subset=[...]`, mirando solo algunas columnas):

```py
import pandas as pd

encuesta = pd.read_csv("encuesta.csv")
print(encuesta.duplicated().sum(), "filas repetidas")
print(encuesta[encuesta.duplicated(keep=False)][["id", "fecha", "ciudad"]])
print(len(encuesta.drop_duplicates()), "respuestas sin repetir")
```

Ninguno de estos métodos cambia la tabla original: devuelven una nueva, que hay que guardar (`encuesta = encuesta.drop_duplicates()`).

## Ejercicio

Limpia `encuesta.csv` en este orden y guarda el resultado en la variable `encuesta`:

1. quita las filas repetidas;
2. convierte `puntuacion` en número (lo que no se pueda convertir queda como NaN);
3. rellena las edades que faltan con la mediana y convierte `edad` en enteros;
4. quita las respuestas que se quedaron sin puntuación.

Después escribe este informe:

```txt
Repetidas: 3
Edades rellenadas: 8 (mediana: 42)
Respuestas válidas: 45
Puntuación media: 4.18
```

## Pista

Cuenta las repetidas con `encuesta.duplicated().sum()` antes de quitarlas, y las edades que faltan con `encuesta["edad"].isna().sum()` antes de rellenarlas. Para la mediana como entero, `int(encuesta["edad"].median())`. La media, con `round(..., 2)`.
