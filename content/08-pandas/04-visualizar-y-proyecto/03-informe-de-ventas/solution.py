import matplotlib.pyplot as plt
import pandas as pd


def informe(ventas, productos):
    """Una fila por tienda: ventas, ingresos, ganancia y margen."""
    datos = pd.merge(ventas, productos[["producto", "costo"]], on="producto", validate="many_to_one")
    datos["ingresos"] = datos["unidades"] * datos["precio_unitario"]
    datos["ganancia"] = datos["unidades"] * (datos["precio_unitario"] - datos["costo"])
    resumen = datos.groupby("tienda").agg(
        ventas=("ingresos", "size"),
        ingresos=("ingresos", "sum"),
        ganancia=("ganancia", "sum"),
    )
    resumen["margen"] = (resumen["ganancia"] / resumen["ingresos"] * 100).round(1)
    return resumen.sort_values("ganancia", ascending=False)


ventas = pd.read_csv("ventas.csv")
productos = pd.read_csv("productos.csv")
resumen = informe(ventas, productos)
print(resumen)
resumen.to_csv("informe.csv")

ax = resumen["ganancia"].plot.bar(title="Ganancia por tienda", color="#2a9d8f")
ax.set_xlabel("")
ax.set_ylabel("pesos")
ax.ticklabel_format(axis="y", style="plain")
plt.tight_layout()
plt.show()
