---
title: Limpiar textos y fechas
minutes: 18
summary: Los métodos .str para normalizar textos, map() para unificar categorías y pd.to_datetime() con .dt para trabajar con fechas.
---

En la encuesta, Bogotá aparece escrita de cinco maneras: `Bogotá`, `bogota`, ` Bogotá ` (con espacios), `BOGOTÁ`, `Bogota`. Para pandas son cinco ciudades distintas, y un recuento por ciudad saldría mal. Y las fechas están como texto con el día primero (`02/05/2026`), así que ni se ordenan bien ni se puede saber el mes.

### Textos: el accesorio .str

Las columnas de texto tienen los métodos de los `str` de Python bajo `.str`, aplicados a todas las filas a la vez:

```py
import pandas as pd

encuesta = pd.read_csv("encuesta.csv")
print(encuesta["ciudad"].value_counts())
limpia = encuesta["ciudad"].str.strip().str.lower()
print(limpia.value_counts())
print(encuesta["comentario"].str.contains("café", case=False).sum(), "comentarios hablan del café")
print(int(encuesta["comentario"].str.len().max()), "caracteres en el comentario más largo")
```

- `str.strip()` quita los espacios de los extremos; `str.lower()`, `str.upper()` y `str.title()` cambian las mayúsculas; `str.replace(viejo, nuevo)` reemplaza.
- Los métodos se encadenan: cada uno devuelve otra columna de texto.
- Los NaN siguen siendo NaN (un comentario vacío no se convierte en texto).

Las tildes no se arreglan solas: `bogota` y `bogotá` siguen siendo distintas, y `B/quilla` es una abreviatura. Para unificar categorías, lo más claro es un diccionario con la forma correcta de cada variante y `map()`:

```py
import pandas as pd

encuesta = pd.read_csv("encuesta.csv")
CIUDADES = {"bogotá": "Bogotá", "bogota": "Bogotá", "cali": "Cali"}
ciudad = encuesta["ciudad"].str.strip().str.lower().map(CIUDADES)
print(ciudad.value_counts(dropna=False))
```

`map()` deja NaN en los valores que no están en el diccionario: así se ve enseguida qué variantes faltan por añadir.

### Fechas: pd.to_datetime y .dt

`pd.to_datetime()` convierte texto en fechas de verdad. Con `format` le dices cómo están escritas, y no adivina: `%d/%m/%Y` es día/mes/año con cuatro cifras.

```py
import pandas as pd

encuesta = pd.read_csv("encuesta.csv")
encuesta["fecha"] = pd.to_datetime(encuesta["fecha"], format="%d/%m/%Y")
print(encuesta["fecha"].head(3))
print(encuesta["fecha"].min(), encuesta["fecha"].max())
print(encuesta["fecha"].dt.month.value_counts().sort_index())
print((encuesta["fecha"].max() - encuesta["fecha"].min()).days, "días entre la primera y la última")
```

- Con fechas de verdad, `min()`, `max()` y `sort_values()` funcionan como se espera, y restar dos fechas da una duración.
- El accesorio `.dt` extrae partes de cada fecha: `dt.year`, `dt.month`, `dt.day`, `dt.dayofweek` (0 es lunes) o `dt.strftime("%d/%m")`.
- `dt.month_name()` da el nombre del mes en inglés; para tenerlo en español, traduce el número con una lista o un diccionario.

## Ejercicio

Sin las respuestas repetidas, deja limpias tres columnas de la encuesta (en la variable `encuesta`):

- `ciudad`: solo `Bogotá`, `Medellín`, `Cali` o `Barranquilla`;
- `recomienda`: `True` si la respuesta es un sí (en cualquiera de sus formas) y `False` si es un no;
- `fecha`: fechas de verdad.

Después escribe las respuestas por ciudad, el porcentaje de clientes que recomendarían Café Andino (con una cifra decimal) y las respuestas de cada mes, con el nombre del mes en español:

```txt
ciudad
Bogotá          ...
...
Recomendarían Café Andino: 81.2 %
fecha
enero      11
...
```

## Pista

Para `ciudad`: `.str.strip().str.lower().map(...)` con un diccionario que incluya `"bogota"`, `"medellin"` y `"b/quilla"`. Para `recomienda`: `.str.lower().str.replace("sí", "si") == "si"`. Como `True` cuenta como 1, `encuesta["recomienda"].mean() * 100` es el porcentaje. Para los meses, `dt.month.value_counts().sort_index()` y `rename(index=...)` con un diccionario de número a nombre.
