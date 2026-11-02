import pandas as pd

ventas = pd.read_csv("ventas.csv")
ventas["total"] = ventas["unidades"] * ventas["precio_unitario"]
print(ventas.groupby("tienda")["total"].sum())
