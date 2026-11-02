import pandas as pd

ventas = pd.read_csv("ventas.csv")
ventas["total"] = ventas["unidades"] * ventas["precio_unitario"]


def tamano(total):
    if total >= 30000:
        return "grande"
    return "normal"


ventas["tamano"] = ventas["total"].apply(tamano)
print(ventas.nlargest(5, "total")[["fecha", "tienda", "producto", "total"]])
print(ventas["tamano"].value_counts())
