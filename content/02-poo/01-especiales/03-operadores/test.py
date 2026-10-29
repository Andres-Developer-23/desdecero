assert len(rock) == 2 and len(salsa) == 3, "Sumar dos listas no debería cambiar las originales: crea una ListaReproduccion nueva en __add__"
assert isinstance(mix, ListaReproduccion), "rock + salsa debería devolver una ListaReproduccion"
assert list(salsa + rock) == ["Calor", "Sabor", "Brisa", "Bohemia", "Ruido"], "En la suma van primero las canciones de la lista de la izquierda"
assert "Nada" not in mix, "«Nada» no debería estar en la lista"
