import pandas as pd

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
         "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

ventas = pd.read_csv("ventas.csv")
ventas["ingresos"] = ventas["unidades"] * ventas["precio_unitario"]
