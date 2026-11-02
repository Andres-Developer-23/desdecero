import matplotlib.pyplot as plt
import pandas as pd

MEDIDAS = ["largo_sepalo", "ancho_sepalo", "largo_petalo", "ancho_petalo"]


def predecir(flores):
    """Adivina la especie de cada flor con dos preguntas sobre sus pétalos."""
    especies = []
    for largo, ancho in zip(flores["largo_petalo"], flores["ancho_petalo"]):
        if largo < 2.5:
            especies.append("setosa")
        elif ancho < 1.75:
            especies.append("versicolor")
        else:
            especies.append("virginica")
    return pd.Series(especies, index=flores.index)


iris = pd.read_csv("iris.csv")
print(f"Flores: {len(iris)} · Medidas: {len(MEDIDAS)}")
print(iris["especie"].value_counts().to_string())
print()

medias = iris.groupby("especie")[MEDIDAS].mean().round(2)
print("Medidas medias por especie (cm):")
print(medias)
print()

diferencias = medias.max() - medias.min()
mas_distinta = diferencias.idxmax()
print(f"La medida que más cambia entre especies: {mas_distinta} ({diferencias[mas_distinta]:.2f} cm)")

iris["prediccion"] = predecir(iris)
aciertos = (iris["prediccion"] == iris["especie"]).sum()
print(f"La regla acierta {aciertos} de {len(iris)} flores ({aciertos / len(iris):.1%})")
errores = iris[iris["prediccion"] != iris["especie"]]
print(errores[["largo_petalo", "ancho_petalo", "especie", "prediccion"]])

fig, ax = plt.subplots()
for especie, grupo in iris.groupby("especie"):
    ax.scatter(grupo["largo_petalo"], grupo["ancho_petalo"], label=especie, alpha=0.7)
ax.set_title("Pétalos de las tres especies de iris")
ax.set_xlabel("largo del pétalo (cm)")
ax.set_ylabel("ancho del pétalo (cm)")
ax.legend()
plt.show()
