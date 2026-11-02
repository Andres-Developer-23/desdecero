import pandas as pd

ventas = pd.read_csv("ventas.csv")
postres = ventas[ventas["categoria"] == "Postres"]
print(postres[["fecha", "producto", "unidades"]])
