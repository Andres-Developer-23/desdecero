assert Jugador("Eva", 10) < Jugador("Fran", 11), "Jugador('Eva', 10) debería ser menor que Jugador('Fran', 11)"
assert not (Jugador("Eva", 10) < Jugador("Fran", 10)), "Con los mismos puntos, ninguno es menor"
assert Jugador("Eva", 10) != Jugador("Fran", 10), "Dos jugadores con distinto nombre no son iguales"
assert (Jugador("Eva", 10) == "Eva") is False, "Comparar un Jugador con un texto debería dar False (devuelve NotImplemented)"
