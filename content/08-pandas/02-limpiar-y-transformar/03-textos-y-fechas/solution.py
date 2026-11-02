import pandas as pd

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
         "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
CIUDADES = {
    "bogotá": "Bogotá", "bogota": "Bogotá",
    "medellín": "Medellín", "medellin": "Medellín",
    "cali": "Cali",
    "barranquilla": "Barranquilla", "b/quilla": "Barranquilla",
}

encuesta = pd.read_csv("encuesta.csv").drop_duplicates()
encuesta["ciudad"] = encuesta["ciudad"].str.strip().str.lower().map(CIUDADES)
encuesta["recomienda"] = encuesta["recomienda"].str.lower().str.replace("sí", "si") == "si"
encuesta["fecha"] = pd.to_datetime(encuesta["fecha"], format="%d/%m/%Y")

print(encuesta["ciudad"].value_counts())
print(f"Recomendarían Café Andino: {encuesta['recomienda'].mean() * 100:.1f} %")
por_mes = encuesta["fecha"].dt.month.value_counts().sort_index()
print(por_mes.rename(index=dict(enumerate(MESES, 1))))
