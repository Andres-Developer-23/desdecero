import pandas as pd

encuesta = pd.read_csv("encuesta.csv")

repetidas = encuesta.duplicated().sum()
encuesta = encuesta.drop_duplicates()

encuesta["puntuacion"] = pd.to_numeric(encuesta["puntuacion"], errors="coerce")

sin_edad = encuesta["edad"].isna().sum()
mediana = int(encuesta["edad"].median())
encuesta["edad"] = encuesta["edad"].fillna(mediana).astype(int)

encuesta = encuesta.dropna(subset=["puntuacion"])

print("Repetidas:", repetidas)
print(f"Edades rellenadas: {sin_edad} (mediana: {mediana})")
print("Respuestas válidas:", len(encuesta))
print("Puntuación media:", round(encuesta["puntuacion"].mean(), 2))
