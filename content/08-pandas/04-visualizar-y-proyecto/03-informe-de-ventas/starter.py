import matplotlib.pyplot as plt
import pandas as pd


def informe(ventas, productos):
    """Una fila por tienda: ventas, ingresos, ganancia y margen."""
    return pd.DataFrame()


ventas = pd.read_csv("ventas.csv")
productos = pd.read_csv("productos.csv")
resumen = informe(ventas, productos)
print(resumen)
