class Libro:
    def __init__(self, titulo, autor):
        self.titulo = titulo
        self.autor = autor
        self.prestado = False


class BibliotecaError(Exception):
    """Base de los errores de la biblioteca."""


class LibroNoEncontrado(BibliotecaError):
    def __init__(self, titulo):
        super().__init__(f"No existe el libro «{titulo}»")
        self.titulo = titulo


class LibroPrestado(BibliotecaError):
    def __init__(self, titulo):
        super().__init__(f"«{titulo}» ya está prestado")
        self.titulo = titulo


class Biblioteca:
    def __init__(self):
        self.libros = []

    def agregar(self, libro):
        self.libros.append(libro)

    def buscar(self, titulo):
        for libro in self.libros:
            if libro.titulo == titulo:
                return libro
        raise LibroNoEncontrado(titulo)

    def prestar(self, titulo):
        libro = self.buscar(titulo)
        if libro.prestado:
            raise LibroPrestado(titulo)
        libro.prestado = True

    def devolver(self, titulo):
        self.buscar(titulo).prestado = False

    def disponibles(self):
        return [libro.titulo for libro in self.libros if not libro.prestado]


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
