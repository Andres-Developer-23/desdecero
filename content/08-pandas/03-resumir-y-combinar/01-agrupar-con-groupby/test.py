import pandas as _pd

assert isinstance(resumen, _pd.DataFrame), "resumen debería ser un DataFrame"
assert resumen.columns.tolist() == ["ventas", "unidades", "ingresos", "ticket_medio"], "resumen debería tener las columnas ventas, unidades, ingresos y ticket_medio, y tiene " + str(resumen.columns.tolist())
assert resumen.index.tolist() == ["Bogotá", "Medellín", "Cali", "Barranquilla"], "Las tiendas deberían ir de más a menos ingresos"
assert resumen.loc["Cali"].tolist() == [64, 165, 981600, 15338], "Los datos de Cali no coinciden: " + str(resumen.loc["Cali"].tolist())
assert _pd.api.types.is_integer_dtype(resumen["ticket_medio"]), "ticket_medio debería ser entero (round() y astype(int))"
