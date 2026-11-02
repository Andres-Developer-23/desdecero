import pandas as _pd

assert isinstance(por_categoria, _pd.DataFrame), "por_categoria debería ser un DataFrame"
assert por_categoria.columns.tolist() == ["ingresos", "costo", "ganancia", "margen"], "por_categoria debería tener las columnas ingresos, costo, ganancia y margen, y tiene " + str(por_categoria.columns.tolist())
assert por_categoria.index.tolist() == ["Bebidas frías", "Bebidas calientes", "Postres", "Panadería"], "Las categorías deberían ir de la que más gana a la que menos"
assert por_categoria.loc["Postres"].tolist() == [1074000, 414200, 659800, 61.4], "Los datos de Postres no coinciden: " + str(por_categoria.loc["Postres"].tolist())
