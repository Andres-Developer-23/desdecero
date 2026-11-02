import pandas as pd

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
         "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

encuesta = pd.read_csv("encuesta.csv").drop_duplicates()
print(encuesta["ciudad"].value_counts())
