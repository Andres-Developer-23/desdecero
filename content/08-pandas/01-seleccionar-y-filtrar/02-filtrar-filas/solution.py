import pandas as pd

ventas = pd.read_csv("ventas.csv")
mascara = (
    (ventas["tienda"] == "Medellín")
    & (ventas["categoria"] == "Postres")
    & (ventas["unidades"] >= 3)
)
grandes = ventas.loc[mascara, ["fecha", "producto", "unidades"]]
print(grandes)
print(f"{len(grandes)} ventas, {grandes['unidades'].sum()} unidades")
