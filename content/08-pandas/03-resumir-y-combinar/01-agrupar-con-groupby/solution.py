import pandas as pd

ventas = pd.read_csv("ventas.csv")
ventas["total"] = ventas["unidades"] * ventas["precio_unitario"]

resumen = ventas.groupby("tienda").agg(
    ventas=("total", "size"),
    unidades=("unidades", "sum"),
    ingresos=("total", "sum"),
    ticket_medio=("total", "mean"),
)
resumen["ticket_medio"] = resumen["ticket_medio"].round().astype(int)
resumen = resumen.sort_values("ingresos", ascending=False)
print(resumen)
