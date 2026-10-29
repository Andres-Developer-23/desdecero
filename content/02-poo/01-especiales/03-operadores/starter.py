class ListaReproduccion:
    def __init__(self, nombre):
        self.nombre = nombre
        self.canciones = []

    def agregar(self, cancion):
        pass  # escribe aquí tu código

    # Escribe aquí __len__, __contains__, __iter__, __getitem__ y __add__


rock = ListaReproduccion("Rock")
for cancion in ["Bohemia", "Ruido"]:
    rock.agregar(cancion)
salsa = ListaReproduccion("Salsa")
for cancion in ["Calor", "Sabor", "Brisa"]:
    salsa.agregar(cancion)

mix = rock + salsa
print(f"Mix: {mix.nombre} · {len(mix)} canciones")
for numero, cancion in enumerate(mix, 1):
    print(f"{numero}. {cancion}")
print("Última:", mix[-1])
print("¿Está «Ruido»?", "Ruido" in mix)
