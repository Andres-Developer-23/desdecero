prueba = Pelicula("Prueba", "Alguien", 2000)
assert prueba.titulo == "Prueba" and prueba.director == "Alguien" and prueba.anio == 2000, "Pelicula debería guardar titulo, director y anio en atributos con esos nombres"
assert prueba.vista is False, "Una película nueva debería tener vista = False"
assert primera.vista is True and segunda.vista is False, "Marca como vista solo la primera película"
