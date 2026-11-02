import random

DIFICULTADES = {
    "1": ("fácil", 10),
    "2": ("media", 5),
    "3": ("difícil", 3),
}


def plural(cantidad, palabra):
    return f"{cantidad} {palabra}" if cantidad == 1 else f"{cantidad} {palabra}s"


def elegir_dificultad():
    """Pregunta hasta que elijan una dificultad válida y devuelve (nombre, intentos)."""
    print("Elige la dificultad:")
    for opcion, (nombre, intentos) in DIFICULTADES.items():
        print(f"{opcion}. {nombre.capitalize()} ({intentos} intentos)")
    while True:
        eleccion = input("Tu elección: ").strip()
        if eleccion in DIFICULTADES:
            return DIFICULTADES[eleccion]
        print("Elige 1, 2 o 3.")


def leer_numero(intento):
    """Pide un número del 1 al 100. Devuelve el número o "pista"."""
    while True:
        texto = input(f"Intento {intento}: ").strip().lower()
        if texto == "pista":
            return texto
        if texto.isdigit() and 1 <= int(texto) <= 100:
            return int(texto)
        print("Escribe un número del 1 al 100 (o «pista»).")


def jugar_partida():
    """Juega una partida. Devuelve (dificultad, intentos usados) si gana, o None si pierde."""
    nombre, maximo = elegir_dificultad()
    secreto = random.randint(1, 100)
    print(f"Dificultad {nombre}: tienes {maximo} intentos.")
    print()
    pista_usada = False
    intento = 1
    while intento <= maximo:
        numero = leer_numero(intento)
        if numero == "pista":
            if pista_usada:
                print("Ya usaste tu pista en esta partida.")
            else:
                pista_usada = True
                paridad = "par" if secreto % 2 == 0 else "impar"
                print(f"Pista: es un número {paridad}.")
            continue
        if numero == secreto:
            print(f"¡Correcto! Lo adivinaste en {plural(intento, 'intento')}.")
            return nombre, intento
        if secreto < numero:
            print(f"Incorrecto: el número es menor que {numero}.")
        else:
            print(f"Incorrecto: el número es mayor que {numero}.")
        intento += 1
    print(f"Te quedaste sin intentos. El número era {secreto}.")
    return None


def main():
    print("¡Bienvenido al juego de adivinar el número!")
    print("Estoy pensando en un número del 1 al 100.")
    records = {}
    while True:
        print()
        resultado = jugar_partida()
        if resultado:
            nombre, intentos = resultado
            if nombre not in records or intentos < records[nombre]:
                records[nombre] = intentos
                print(f"Nuevo récord en dificultad {nombre}: {plural(intentos, 'intento')}.")
        print()
        if input("¿Otra partida? (s/n): ").strip().lower() != "s":
            break
    print("¡Gracias por jugar!")


main()
