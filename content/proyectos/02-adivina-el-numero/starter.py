import random

DIFICULTADES = {
    "1": ("fácil", 10),
    "2": ("media", 5),
    "3": ("difícil", 3),
}


def elegir_dificultad():
    """Pregunta hasta que elijan una dificultad válida y devuelve (nombre, intentos)."""
    print("Elige la dificultad:")
    for opcion, (nombre, intentos) in DIFICULTADES.items():
        print(f"{opcion}. {nombre.capitalize()} ({intentos} intentos)")
    # Tu código aquí


def jugar_partida():
    """Juega una partida. Devuelve (dificultad, intentos usados) si gana, o None si pierde."""
    nombre, maximo = elegir_dificultad()
    secreto = random.randint(1, 100)
    print(f"Dificultad {nombre}: tienes {maximo} intentos.")
    print()
    # Tu código aquí


def main():
    print("¡Bienvenido al juego de adivinar el número!")
    print("Estoy pensando en un número del 1 al 100.")
    records = {}
    # Tu código aquí: juega partidas mientras quieran seguir y guarda los récords
    print("¡Gracias por jugar!")


main()
