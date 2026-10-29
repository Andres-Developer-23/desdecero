class Bateria:
    def __init__(self):
        self.nivel = 0

    # Escribe aquí los métodos cargar, usar y estado


bateria = Bateria()
print(bateria.estado())
bateria.cargar(20)
print(bateria.estado())
bateria.cargar(60)
print(bateria.estado())
bateria.usar(30)
print(bateria.estado())
bateria.usar(500)
print(bateria.estado())
