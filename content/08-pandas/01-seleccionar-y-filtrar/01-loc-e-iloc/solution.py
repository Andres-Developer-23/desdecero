import pandas as pd

productos = pd.read_csv("productos.csv").set_index("producto")
print("Precio del capuchino:", productos.loc["Capuchino", "precio"])
print(productos.loc["Pandebono":"Brownie", ["precio", "costo"]])
print(productos.iloc[0:3])
print("Categoría del último:", productos.iloc[-1]["categoria"])
