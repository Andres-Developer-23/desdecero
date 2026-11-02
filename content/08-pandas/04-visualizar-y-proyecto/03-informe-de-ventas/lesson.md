---
title: "Proyecto: un informe de ventas"
minutes: 24
summary: "El proyecto final: un análisis completo, de los archivos al informe, con una función que lo calcula, un CSV con el resultado y un gráfico."
---

Has visto todas las piezas. Un análisis de datos real las encadena siempre en el mismo orden:

1. **La pregunta**: qué quieres saber. «¿Qué tienda es la más rentable?» es una pregunta; «mirar los datos» no lo es.
2. **Cargar** los datos y explorarlos (`head()`, `dtypes`, `describe()`).
3. **Limpiar**: tipos, valores que faltan, textos y repetidos.
4. **Transformar y combinar**: columnas calculadas y `merge()`.
5. **Resumir**: `groupby()`, `pivot_table()`, `resample()`.
6. **Comunicar**: una tabla clara, un gráfico y, a menudo, un archivo con el resultado.

### Un análisis que se puede repetir

Cuando un análisis se repite (cada mes llegan ventas nuevas), conviene escribirlo como una **función** que recibe los datos y devuelve el resultado: así se puede ejecutar con otros datos y probar con tablas pequeñas, y el programa principal queda corto. Por ejemplo, las ventas de una categoría por mes:

```py
import pandas as pd


def mensual_de(ventas, categoria):
    """Los ingresos de una categoría en cada mes."""
    elegidas = ventas[ventas["categoria"] == categoria].copy()
    elegidas["ingresos"] = elegidas["unidades"] * elegidas["precio_unitario"]
    elegidas["mes"] = pd.to_datetime(elegidas["fecha"]).dt.month
    return elegidas.groupby("mes")["ingresos"].sum()


ventas = pd.read_csv("ventas.csv")
print(mensual_de(ventas, "Bebidas frías"))

prueba = pd.DataFrame({
    "fecha": ["2026-01-05", "2026-01-20", "2026-02-01"],
    "categoria": ["Postres", "Postres", "Panadería"],
    "unidades": [2, 1, 4],
    "precio_unitario": [6000, 7500, 3000],
})
print(mensual_de(prueba, "Postres"))
```

`.copy()` crea una tabla independiente de `ventas`: así, añadir columnas a `elegidas` no toca la tabla original, que la función ha recibido y no debería cambiar.

### Guardar el resultado

`to_csv()` guarda un DataFrame en un archivo que se abre en una hoja de cálculo o que lee otro programa. El índice se guarda como primera columna; si no aporta nada (0, 1, 2…), `index=False` lo omite.

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv")
ventas["ingresos"] = ventas["unidades"] * ventas["precio_unitario"]
top = ventas.groupby("producto")["ingresos"].sum().nlargest(3).reset_index()
top.to_csv("top3.csv", index=False)
print(pd.read_csv("top3.csv"))
```

La consola enseña al final los archivos que guarda tu programa.

## Ejercicio

Café Andino quiere saber qué tienda es la **más rentable**. Escribe la función `informe(ventas, productos)`, que recibe las dos tablas y devuelve un DataFrame con una fila por tienda (la tienda como índice) y estas columnas, en este orden:

- `ventas`: cuántas ventas hubo;
- `ingresos`: suma de unidades × precio unitario;
- `ganancia`: suma de unidades × (precio unitario − costo del producto);
- `margen`: la ganancia en porcentaje de los ingresos, con una cifra decimal.

Ordenado de la tienda que más gana a la que menos. Con los archivos de práctica, el programa principal:

1. escribe el informe;
2. lo guarda en `informe.csv` (con la tienda como primera columna);
3. dibuja la ganancia de cada tienda en un gráfico de barras con el título `Ganancia por tienda`, guarda los ejes en `ax` y lo enseña.

Las comprobaciones también llaman a tu función con otros datos.

## Pista

Dentro de la función: `merge()` con `productos[["producto", "costo"]]`, las columnas `ingresos` y `ganancia`, y `groupby("tienda").agg(ventas=("ingresos", "size"), ingresos=("ingresos", "sum"), ganancia=("ganancia", "sum"))`. Después el margen y `sort_values("ganancia", ascending=False)`. Fuera: `resumen.to_csv("informe.csv")` (sin `index=False`, para guardar la tienda) y `ax = resumen["ganancia"].plot.bar(title="Ganancia por tienda")`.
