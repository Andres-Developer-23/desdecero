import pandas as _pd

assert isinstance(inventario, _pd.DataFrame), "inventario debería ser un DataFrame de pandas"
assert inventario.columns.tolist() == ["producto", "precio", "unidades", "valor"], "inventario debería tener las columnas producto, precio, unidades y valor, en ese orden, y tiene " + str(inventario.columns.tolist())
assert inventario["valor"].tolist() == [100000, 78000, 90000, 48000], "La columna valor debería ser precio × unidades"
