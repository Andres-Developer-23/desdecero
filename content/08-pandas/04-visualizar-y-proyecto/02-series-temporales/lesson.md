---
title: Fechas y series temporales
minutes: 17
summary: Fechas como índice, resample() para resumir por semanas o meses, rolling() para medias móviles y pct_change() para la variación.
---

Muchos datos tienen una fecha: ventas, temperaturas, visitas. Una **serie temporal** son valores ordenados en el tiempo, y pandas tiene herramientas propias para ellas.

### Las fechas como índice

`parse_dates=["fecha"]` convierte la columna al leer el archivo, y con la fecha como índice se puede elegir un periodo escribiéndolo como texto:

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv", parse_dates=["fecha"])
ventas["ingresos"] = ventas["unidades"] * ventas["precio_unitario"]
ventas = ventas.set_index("fecha").sort_index()
print(ventas.index.min(), ventas.index.max())
print(len(ventas.loc["2026-03"]), "ventas en marzo")
print(ventas.loc["2026-06-01":"2026-06-07", ["tienda", "producto", "ingresos"]])
```

`loc["2026-03"]` es todo marzo, y `loc["2026-06-01":"2026-06-07"]`, la primera semana de junio, con los dos días incluidos.

### resample: resumir por periodos

`resample()` es un `groupby()` por tiempo: agrupa las fechas en periodos y resume cada uno.

```py
import pandas as pd

ventas = pd.read_csv("ventas.csv", parse_dates=["fecha"]).set_index("fecha")
ventas["ingresos"] = ventas["unidades"] * ventas["precio_unitario"]
mensual = ventas["ingresos"].resample("ME").sum()
print(mensual)
semanal = ventas["ingresos"].resample("W").sum()
print(semanal.head())
print("Mejor semana:", semanal.idxmax().date(), "con", semanal.max(), "pesos")
```

- La regla dice el periodo: `"D"` (días), `"W"` (semanas, que terminan el domingo), `"ME"` (meses, con la fecha del último día), `"QE"` (trimestres) o `"YE"` (años).
- Los periodos sin datos también salen, con 0 en la suma: así la serie no tiene huecos.
- `idxmax()` da la etiqueta (aquí, la fecha) del valor más alto, e `idxmin()`, la del más bajo.

### Medias móviles y variación

Los datos diarios tienen mucho ruido. Una **media móvil** promedia cada día con los anteriores y deja ver la tendencia; `pct_change()` calcula cuánto cambia cada valor respecto al anterior:

```py
import matplotlib.pyplot as plt
import pandas as pd

ventas = pd.read_csv("ventas.csv", parse_dates=["fecha"]).set_index("fecha")
ventas["ingresos"] = ventas["unidades"] * ventas["precio_unitario"]
diario = ventas["ingresos"].resample("D").sum()
tendencia = diario.rolling(28).mean()
print((ventas["ingresos"].resample("ME").sum().pct_change() * 100).round(1))

ax = diario.plot(alpha=0.3, label="cada día", figsize=(8, 4))
tendencia.plot(ax=ax, label="media de 28 días", linewidth=2)
ax.set_title("Ingresos diarios de Café Andino")
ax.set_xlabel("")
ax.legend()
plt.show()
```

- `rolling(28).mean()` es la media de cada día y los 27 anteriores. Los primeros 27 días no tienen suficientes datos y quedan como NaN.
- `pct_change()` da la variación en tanto por uno: multiplicada por 100, en porcentaje. El primer periodo no tiene anterior y queda como NaN.

## Ejercicio

Calcula los ingresos de cada **mes** con `resample()` y escríbelos con el nombre del mes y su variación respecto al mes anterior (en porcentaje, con una cifra decimal). Después, el mejor mes:

```txt
enero: 775200 pesos
febrero: 624900 pesos (-19.4 %)
...
Mejor mes: mayo
```

## Pista

Lee con `parse_dates=["fecha"]` y usa la fecha como índice. `mensual = ventas["ingresos"].resample("ME").sum()` y `variacion = mensual.pct_change() * 100`. Para recorrer los meses, `for fecha, ingresos in mensual.items():`, y el nombre del mes es `MESES[fecha.month - 1]`. El mejor mes: `mensual.idxmax().month`.
