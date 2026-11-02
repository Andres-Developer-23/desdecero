import pandas as pd

productos = ["Tinto", "Capuchino", "Pandebono", "Brownie"]
precios = [2500, 6500, 3000, 6000]
unidades = [40, 12, 30, 8]

inventario = pd.DataFrame({"producto": productos, "precio": precios, "unidades": unidades})
inventario["valor"] = inventario["precio"] * inventario["unidades"]
print(inventario)
print("Unidades:", inventario["unidades"].sum())
print("Valor total:", inventario["valor"].sum())
print("Precio medio:", inventario["precio"].mean())
