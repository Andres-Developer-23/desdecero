import pandas as pd

ventas = pd.read_csv("ventas.csv")
productos = pd.read_csv("productos.csv")

ventas = pd.merge(ventas, productos[["producto", "costo"]], on="producto", validate="many_to_one")
ventas["ingresos"] = ventas["unidades"] * ventas["precio_unitario"]
ventas["costo"] = ventas["unidades"] * ventas["costo"]
ventas["ganancia"] = ventas["ingresos"] - ventas["costo"]

por_categoria = ventas.groupby("categoria")[["ingresos", "costo", "ganancia"]].sum()
por_categoria["margen"] = (por_categoria["ganancia"] / por_categoria["ingresos"] * 100).round(1)
por_categoria = por_categoria.sort_values("ganancia", ascending=False)
print(por_categoria)
