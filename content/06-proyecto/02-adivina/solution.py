import random

def jugar(secreto):
    intentos = 0
    while True:
        texto = input("Tu número: ")
        try:
            numero = int(texto)
        except ValueError:
            print("Escribe un número entero")
            continue
        intentos += 1
        if numero < secreto:
            print("Más alto")
        elif numero > secreto:
            print("Más bajo")
        else:
            print(f"¡Correcto! Intentos: {intentos}")
            return intentos

# Para jugar de verdad, quita el # de la línea siguiente y pulsa ejecutar:
jugar(random.randint(1, 100))
