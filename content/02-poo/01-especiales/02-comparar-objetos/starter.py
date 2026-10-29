class Jugador:
    def __init__(self, nombre, puntos):
        self.nombre = nombre
        self.puntos = puntos

    # Escribe aquí __eq__, __lt__ y __repr__


jugadores = [Jugador("Ana", 30), Jugador("Bruno", 45), Jugador("Carla", 12)]
print(sorted(jugadores, reverse=True))
print("Ganador:", max(jugadores).nombre)
print(Jugador("Ana", 30) == jugadores[0])
print(Jugador("Ana", 31) == jugadores[0])
