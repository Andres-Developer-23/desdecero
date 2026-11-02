import pandas as pd

ventas = pd.read_csv("ventas.csv")
filas, columnas = ventas.shape
print(f"{filas} ventas y {columnas} columnas")
print("Categorías:", ", ".join(sorted(ventas["categoria"].unique())))
print(ventas["categoria"].value_counts())
print("Unidades vendidas:", ventas["unidades"].sum())
