import matplotlib.pyplot as plt
import pandas as pd

ventas = pd.read_csv("ventas.csv")
ventas["ingresos"] = ventas["unidades"] * ventas["precio_unitario"]

por_producto = ventas.groupby("producto")["ingresos"].sum().sort_values()
ax = por_producto.plot.barh(title="Ingresos por producto")
ax.set_xlabel("pesos")
ax.set_ylabel("")
ax.ticklabel_format(axis="x", style="plain")
plt.tight_layout()
plt.show()
