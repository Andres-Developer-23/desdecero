import matplotlib.axes as _axes

assert isinstance(ax, _axes.Axes), "Guarda en ax lo que devuelve .plot.barh(...)"
assert ax.get_title() == "Ingresos por producto", "El título debería ser «Ingresos por producto», y es «" + ax.get_title() + "»"
assert ax.get_xlabel() == "pesos", "El eje de los valores (x, en barras horizontales) debería decir «pesos»"
_barras = [barra.get_width() for barra in ax.patches]
assert len(_barras) == 9, "Debería haber una barra por producto (9), y hay " + str(len(_barras))
assert _barras == sorted(_barras), "Ordena las barras para que el producto que más ingresa quede arriba (sort_values())"
assert _barras[-1] == 1111500, "La barra de arriba debería ser la del producto que más ingresa: 1111500 pesos"
assert ax.get_yticklabels()[-1].get_text() == "Café frappé", "El producto de arriba debería ser el Café frappé"
