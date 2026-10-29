class ListaReproduccion:
    def __init__(self, nombre):
        self.nombre = nombre
        self.canciones = []

    def agregar(self, cancion):
        self.canciones.append(cancion)

    def __len__(self):
        return len(self.canciones)

    def __contains__(self, cancion):
        return cancion in self.canciones

    def __iter__(self):
        return iter(self.canciones)

    def __getitem__(self, posicion):
        return self.canciones[posicion]

    def __add__(self, otra):
        nueva = ListaReproduccion(self.nombre + " + " + otra.nombre)
        for cancion in self.canciones + otra.canciones:
            nueva.agregar(cancion)
        return nueva


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
