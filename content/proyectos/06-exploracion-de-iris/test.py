import matplotlib.axes as _axes
import pandas as _pd

assert isinstance(medias, _pd.DataFrame), "Guarda en medias la tabla con la media de cada medida por especie"
assert medias.index.tolist() == ["setosa", "versicolor", "virginica"], "medias debería tener una fila por especie (setosa, versicolor y virginica). Tiene: " + str(medias.index.tolist())
assert medias.columns.tolist() == MEDIDAS, "medias debería tener las cuatro medidas como columnas. Tiene: " + str(medias.columns.tolist())
assert medias.loc["virginica", "largo_petalo"] == 5.55, "La media del largo del pétalo de virginica, redondeada a 2 decimales, es 5.55"

_flores = _pd.DataFrame(
    {"largo_petalo": [1.2, 4.0, 4.0, 6.1, 2.5], "ancho_petalo": [0.3, 1.2, 2.0, 1.7, 1.0]},
    index=[10, 20, 30, 40, 50],
)
_r = predecir(_flores)
assert isinstance(_r, _pd.Series), "predecir() debería devolver una Serie de pandas"
assert _r.index.tolist() == [10, 20, 30, 40, 50], "La Serie de predecir() debería tener el mismo índice que las flores que recibe: pd.Series(especies, index=flores.index)"
assert _r.tolist() == ["setosa", "versicolor", "virginica", "versicolor", "versicolor"], "Con otras flores, predecir() debería dar setosa, versicolor, virginica, versicolor y versicolor (2.5 cm de largo ya no es setosa). Da: " + str(_r.tolist())

assert isinstance(ax, _axes.Axes), "Guarda en ax los ejes del gráfico: fig, ax = plt.subplots()"
assert ax.get_title() == "Pétalos de las tres especies de iris", "El título del gráfico debería ser «Pétalos de las tres especies de iris»"
assert len(ax.collections) == 3, "Dibuja una serie de puntos por especie con ax.scatter(): debería haber 3, y hay " + str(len(ax.collections))
assert ax.get_legend() is not None, "Añade una leyenda con ax.legend() para saber qué color es cada especie"
assert sorted(_t.get_text() for _t in ax.get_legend().get_texts()) == ["setosa", "versicolor", "virginica"], "La leyenda debería tener el nombre de cada especie (usa label=especie en cada ax.scatter)"
