class Pelicula:
    def __init__(self, titulo, director, anio):
        self.titulo = titulo
        self.director = director
        self.anio = anio
        self.vista = False


primera = Pelicula("La ciudad dormida", "Ana Torres", 2019)
segunda = Pelicula("Viaje al fondo del mar", "Luis Vega", 2023)

primera.vista = True
for pelicula in [primera, segunda]:
    print(f"{pelicula.titulo} ({pelicula.anio}), de {pelicula.director} · vista: {pelicula.vista}")
