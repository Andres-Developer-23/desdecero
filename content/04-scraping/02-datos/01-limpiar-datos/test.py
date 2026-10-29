assert isinstance(libros, list) and len(libros) == 6, "libros debería ser una lista con los 6 libros de la página"
assert libros[0] == {"titulo": "El faro de la niebla", "precio": 45900, "estrellas": 4}, "El primer libro debería ser {'titulo': 'El faro de la niebla', 'precio': 45900, 'estrellas': 4}, no " + str(libros[0])
assert libros[5]["titulo"] == "Breve historia del café en los Andes", "Usa el título completo (atributo title), no el texto recortado"
