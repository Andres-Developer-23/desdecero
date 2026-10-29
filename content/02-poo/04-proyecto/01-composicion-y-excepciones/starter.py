class Libro:
    def __init__(self, titulo, autor):
        self.titulo = titulo
        self.autor = autor
        self.prestado = False


class BibliotecaError(Exception):
    """Base de los errores de la biblioteca."""


# Escribe aquí LibroNoEncontrado y LibroPrestado


class Biblioteca:
    def __init__(self):
        self.libros = []

    def agregar(self, libro):
        self.libros.append(libro)

    # Escribe aquí buscar, prestar, devolver y disponibles


biblioteca = Biblioteca()
for titulo, autor in [("Rayuela", "Julio Cortázar"), ("Pedro Páramo", "Juan Rulfo"), ("Aura", "Carlos Fuentes")]:
    biblioteca.agregar(Libro(titulo, autor))

for titulo in ["Rayuela", "Rayuela", "Ficciones"]:
    try:
        biblioteca.prestar(titulo)
        print("Prestado:", titulo)
    except BibliotecaError as error:
        print("Error:", error)
print("Disponibles:", biblioteca.disponibles())
biblioteca.devolver("Rayuela")
print("Disponibles:", biblioteca.disponibles())
