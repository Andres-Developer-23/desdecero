---
title: Las flores de iris
level: principiante
tags: [pandas, Gráficos, Datos]
minutes: 60
runtime: pandas
requires: pandas
file: iris.py
summary: "Explora el conjunto de datos más famoso del análisis de datos, encuentra qué distingue a tres especies de flores y escribe tu primer clasificador."
---

En 1936, el estadístico Ronald Fisher publicó las medidas de 150 flores de iris de tres especies: *setosa*, *versicolor* y *virginica*, 50 de cada una. Para cada flor hay cuatro medidas en centímetros: el largo y el ancho del **sépalo** (las hojitas verdes que protegen la flor) y del **pétalo**. Casi un siglo después, sigue siendo el primer conjunto de datos con el que practica cualquiera que aprende análisis de datos o aprendizaje automático.

Tu misión es explorarlo con pandas y responder a una pregunta: **¿se puede saber de qué especie es una flor solo con sus medidas?** Al final escribirás un pequeño **clasificador**, una regla que adivina la especie, y medirás cuántas veces acierta.

### Los datos

Están en `iris.csv` (ábrelo en la pestaña **datos**), una fila por flor:

```txt
largo_sepalo,ancho_sepalo,largo_petalo,ancho_petalo,especie
5.1,3.5,1.4,0.2,setosa
7.0,3.2,4.7,1.4,versicolor
6.3,3.3,6.0,2.5,virginica
...
```

### Requisitos

1. **Un primer vistazo**: cuántas flores y medidas hay, y cuántas flores de cada especie.
2. **Las medias por especie**: una tabla `medias` con la media de cada medida para cada especie, redondeada a 2 decimales.
3. **Lo que más las distingue**: la medida cuya media cambia más de una especie a otra (la diferencia entre la mayor y la menor de sus medias).
4. **Un clasificador**: la función `predecir(flores)` recibe un DataFrame de flores y devuelve una Serie con la especie que adivina para cada una, con esta regla: si el pétalo mide menos de 2.5 cm de largo, es *setosa*; si no, si mide menos de 1.75 cm de ancho, es *versicolor*; y si no, es *virginica*.
5. **¿Cuánto acierta?**: cuántas flores clasifica bien la regla y en cuáles se equivoca.
6. **Un gráfico**: los pétalos de todas las flores en un gráfico de dispersión (largo en el eje x, ancho en el y), con un color por especie y una leyenda.

### Ejemplo

```txt
Flores: 150 · Medidas: 4
especie
setosa        50
versicolor    50
virginica     50

Medidas medias por especie (cm):
            largo_sepalo  ancho_sepalo  largo_petalo  ancho_petalo
especie
setosa              5.01          3.43          1.46          0.25
...

La medida que más cambia entre especies: largo_petalo (4.09 cm)
La regla acierta 144 de 150 flores (96.0%)
```

### Cómo empezar

Un `groupby("especie")` seguido de `.mean()` da las medias de cada especie de una vez. Sobre esa tabla, `medias.max()` y `medias.min()` dan, para cada columna, la mayor y la menor media; su resta es una Serie con la diferencia de cada medida, e `idxmax()` dice cuál es la mayor.

Para la regla, recorre a la vez los largos y los anchos de los pétalos con `zip` y decide con `if` / `elif` / `else`. Devuelve la lista de especies como `pd.Series(especies, index=flores.index)`, para que cada predicción quede en la fila de su flor. Comparar dos Series con `==` da una Serie de `True` y `False`, y `.sum()` cuenta los `True`.

Para el gráfico, dibuja cada especie por separado con `ax.scatter(...)` y su `label`, recorriendo `iris.groupby("especie")`, y termina con `ax.legend()` y `plt.show()`.

### Para ir más allá

Mira el gráfico: ¿dónde están las flores que la regla clasifica mal? Prueba otros umbrales y busca una regla que acierte más. Y cuando quieras dar el salto al aprendizaje automático, la librería scikit-learn trae este mismo conjunto de datos y modelos que aprenden reglas parecidas solos, como los árboles de decisión.

## Objetivo

Escribe `iris.py`. Las comprobaciones lo ejecutan con `iris.csv` y revisan:

- que la salida sea exactamente la del ejemplo y la lista de flores mal clasificadas: el primer vistazo (`print(iris["especie"].value_counts().to_string())`), la tabla `medias` con el título `Medidas medias por especie (cm):`, la medida que más cambia y la línea `La regla acierta 144 de 150 flores (96.0%)`, seguida de la tabla de las 6 flores que fallan con las columnas `largo_petalo`, `ancho_petalo`, `especie` y `prediccion`;
- que `medias` tenga una fila por especie y las cuatro medidas;
- que `predecir` funcione también con otras flores;
- que el gráfico (`ax`) tenga el título `Pétalos de las tres especies de iris`, una serie de puntos por especie y una leyenda.

## Pista

Para guardar la predicción en la tabla y quedarte con los fallos:

```py
iris["prediccion"] = predecir(iris)
errores = iris[iris["prediccion"] != iris["especie"]]
print(errores[["largo_petalo", "ancho_petalo", "especie", "prediccion"]])
```

El porcentaje con un decimal sale de `f"{aciertos / len(iris):.1%}"`. Para el gráfico, crea la figura con `fig, ax = plt.subplots()` y usa ese `ax` en todo lo demás.

## Solución

La solución de referencia escribe `predecir` con un bucle, que se lee igual que la regla. Con pandas también se puede escribir sin bucle, decidiendo para todas las flores a la vez con `numpy.select`:

```py
import numpy as np

condiciones = [flores["largo_petalo"] < 2.5, flores["ancho_petalo"] < 1.75]
especies = np.select(condiciones, ["setosa", "versicolor"], default="virginica")
```

Con 150 flores no hay diferencia, pero con millones de filas la versión sin bucle es mucho más rápida.

La regla acierta el 96 % porque las *setosa* tienen los pétalos mucho más pequeños que las demás (se separan perfectamente), mientras que algunas *versicolor* y *virginica* se parecen mucho: las 6 que fallan son flores de esas dos especies con pétalos de tamaño intermedio. Ningún umbral sencillo las separa todas, y eso es justo lo que se ve en el gráfico.
