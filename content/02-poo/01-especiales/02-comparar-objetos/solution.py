class Jugador:
    def __init__(self, nombre, puntos):
        self.nombre = nombre
        self.puntos = puntos

    def __eq__(self, otro):
        if not isinstance(otro, Jugador):
            return NotImplemented
        return self.nombre == otro.nombre and self.puntos == otro.puntos

    def __lt__(self, otro):
        return self.puntos < otro.puntos

    def __repr__(self):
        return f"Jugador({self.nombre!r}, {self.puntos})"


jugadores = [Jugador("Ana", 30), Jugador("Bruno", 45), Jugador("Carla", 12)]
print(sorted(jugadores, reverse=True))
print("Ganador:", max(jugadores).nombre)
print(Jugador("Ana", 30) == jugadores[0])
print(Jugador("Ana", 31) == jugadores[0])
