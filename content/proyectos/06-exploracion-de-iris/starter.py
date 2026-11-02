import matplotlib.pyplot as plt
import pandas as pd

MEDIDAS = ["largo_sepalo", "ancho_sepalo", "largo_petalo", "ancho_petalo"]


def predecir(flores):
    """Adivina la especie de cada flor con dos preguntas sobre sus pétalos."""
    # Tu código aquí: devuelve una Serie con una especie por flor


iris = pd.read_csv("iris.csv")
print(f"Flores: {len(iris)} · Medidas: {len(MEDIDAS)}")

# Tu código aquí: flores por especie, medias, la medida que más cambia,
# los aciertos de la regla y el gráfico
