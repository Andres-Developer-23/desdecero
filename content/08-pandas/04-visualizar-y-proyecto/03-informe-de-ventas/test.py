import matplotlib.axes as _axes
import pandas as _pd

_productos = _pd.DataFrame({"producto": ["A", "B"], "categoria": ["X", "X"], "precio": [100, 50], "costo": [60, 10]})
_ventas = _pd.DataFrame({
    "fecha": ["2026-01-01"] * 4,
    "tienda": ["Norte", "Norte", "Sur", "Sur"],
    "producto": ["A", "B", "A", "A"],
    "categoria": ["X"] * 4,
    "unidades": [1, 2, 3, 1],
    "precio_unitario": [100, 50, 100, 120],
})
_original = _ventas.copy()
_r = informe(_ventas, _productos)
assert isinstance(_r, _pd.DataFrame), "informe() debería devolver un DataFrame"
assert _r.columns.tolist() == ["ventas", "ingresos", "ganancia", "margen"], "El informe debería tener las columnas ventas, ingresos, ganancia y margen, y tiene " + str(_r.columns.tolist())
assert _r.index.tolist() == ["Sur", "Norte"], "Las tiendas deberían ir de la que más gana a la que menos: con los datos de prueba, Sur y después Norte"
assert _r.loc["Norte"].tolist() == [2, 200, 120, 60.0], "Con los datos de prueba, Norte debería dar [2, 200, 120, 60.0], y da " + str(_r.loc["Norte"].tolist())
assert _r.loc["Sur"].tolist() == [2, 420, 180, 42.9], "Con los datos de prueba, Sur debería dar [2, 420, 180, 42.9], y da " + str(_r.loc["Sur"].tolist())
assert _ventas.equals(_original), "informe() no debería cambiar la tabla de ventas que recibe"

_guardado = _pd.read_csv("informe.csv", index_col=0)
assert _guardado.index.tolist() == ["Bogotá", "Medellín", "Cali", "Barranquilla"], "informe.csv debería tener las tiendas como primera columna, de la que más gana a la que menos"
assert _guardado.loc["Bogotá", "ganancia"] == 937100, "En informe.csv, la ganancia de Bogotá debería ser 937100"

assert isinstance(ax, _axes.Axes), "Guarda en ax lo que devuelve .plot.bar(...)"
assert ax.get_title() == "Ganancia por tienda", "El título del gráfico debería ser «Ganancia por tienda»"
assert len(ax.patches) == 4, "Debería haber una barra por tienda"
