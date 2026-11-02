---
title: Gráficos con matplotlib
minutes: 18
summary: "Gráficos de barras, líneas e histogramas con .plot() de pandas y matplotlib: títulos, ejes, varios gráficos y guardarlos."
---

Una tabla de números dice mucho, pero un gráfico lo dice de un vistazo. pandas dibuja con **matplotlib**, la librería de gráficos más usada de Python: cada DataFrame y cada Series tienen el método `.plot()`.

### Tu primer gráfico

```py
import matplotlib.pyplot as plt
import pandas as pd

ventas = pd.read_csv("ventas.csv")
ventas["total"] = ventas["unidades"] * ventas["precio_unitario"]
por_tienda = ventas.groupby("tienda")["total"].sum().sort_values(ascending=False)

ax = por_tienda.plot.bar(title="Ingresos por tienda", color="#2a9d8f")
ax.set_xlabel("")
ax.set_ylabel("pesos")
ax.ticklabel_format(axis="y", style="plain")
plt.tight_layout()
plt.show()
```

- `import matplotlib.pyplot as plt` es la forma habitual de importar matplotlib.
- `serie.plot.bar()` dibuja una barra por valor, con el índice como etiquetas. `plot.barh()` las pone horizontales, que se leen mejor con nombres largos.
- `.plot()` devuelve los **ejes** (`ax`), el objeto con el que se ajusta el gráfico: `set_title()`, `set_xlabel()`, `set_ylabel()`…
- Con números grandes, matplotlib escribe la escala aparte (un `1e6` en la esquina: millones). `ax.ticklabel_format(axis="y", style="plain")` escribe los números enteros.
- `plt.tight_layout()` ajusta los márgenes para que no se corten las etiquetas.
- `plt.show()` enseña el gráfico. En tu ordenador abre una ventana; aquí, aparece en la salida. Sin `plt.show()`, el gráfico se crea pero no se ve.

### Otros tipos de gráfico

```py
import matplotlib.pyplot as plt
import pandas as pd

ventas = pd.read_csv("ventas.csv")
ventas["total"] = ventas["unidades"] * ventas["precio_unitario"]

fig, (izquierda, derecha) = plt.subplots(1, 2, figsize=(10, 4))
ventas["total"].plot.hist(bins=12, ax=izquierda, title="¿Cuánto vale una venta?")
izquierda.set_xlabel("pesos")
ventas.groupby("categoria")["unidades"].sum().plot.pie(ax=derecha, autopct="%.0f %%", title="Unidades por categoría")
derecha.set_ylabel("")
plt.tight_layout()
plt.show()
```

- `plot.hist(bins=12)` es un **histograma**: reparte los valores en 12 intervalos y cuenta cuántos caen en cada uno. Sirve para ver cómo se distribuyen los datos.
- `plot.pie()` es un gráfico de tarta; `plot.line()`, de líneas (el de por defecto, ideal para la evolución en el tiempo), y `plot.scatter(x=..., y=...)`, de puntos, para ver la relación entre dos columnas.
- `plt.subplots(1, 2)` crea una figura con dos ejes, uno al lado del otro, y `ax=` dice en cuál dibujar cada gráfico. `figsize` es el tamaño en pulgadas.

### Guardar el gráfico

`plt.savefig("ingresos.png", dpi=150)` guarda la figura en un archivo de imagen, para un informe o una presentación. Va **antes** de `plt.show()`, porque después de enseñarla la figura se cierra.

Un buen gráfico tiene un título que dice qué muestra, los ejes con sus unidades y nada que distraiga. Si las barras se ordenan de mayor a menor, se lee mucho mejor.

## Ejercicio

Dibuja un gráfico de **barras horizontales** con los ingresos (unidades × precio unitario) de cada **producto**, ordenadas para que el producto que más ingresa quede **arriba**. Ponle el título `Ingresos por producto` y la etiqueta `pesos` en el eje de los valores, guarda los ejes en la variable `ax` y enséñalo con `plt.show()`.

## Pista

`ventas.groupby("producto")["ingresos"].sum().sort_values()` ordena de menor a mayor: en un gráfico de barras horizontales, la primera barra queda abajo, así que el mayor queda arriba. Después, `ax = serie.plot.barh(title="Ingresos por producto")` y `ax.set_xlabel("pesos")` (en las barras horizontales, los valores van en el eje x).
