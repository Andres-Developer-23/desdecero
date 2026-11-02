import pandas as pd

encuesta = pd.read_csv("encuesta.csv")
print(encuesta.isna().sum())
