assert issubclass(LibroNoEncontrado, BibliotecaError) and issubclass(LibroPrestado, BibliotecaError), "Las dos excepciones deberían heredar de BibliotecaError"
assert biblioteca.buscar("Aura").autor == "Carlos Fuentes", "buscar() debería devolver el objeto Libro"
try:
    biblioteca.devolver("Nada")
    assert False, "devolver() de un libro que no existe debería lanzar LibroNoEncontrado"
except LibroNoEncontrado as error:
    assert str(error) == "No existe el libro «Nada»", "El mensaje de LibroNoEncontrado debería ser «No existe el libro «Nada»», no " + repr(str(error))
