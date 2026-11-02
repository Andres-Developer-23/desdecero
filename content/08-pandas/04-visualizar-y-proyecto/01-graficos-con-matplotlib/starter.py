import matplotlib.pyplot as plt
import pandas as pd

ventas = pd.read_csv("ventas.csv")
ventas["ingresos"] = ventas["unidades"] * ventas["precio_unitario"]
