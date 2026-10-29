class Bateria:
    def __init__(self):
        self.nivel = 0

    def cargar(self, minutos):
        self.nivel = min(100, self.nivel + minutos * 2)

    def usar(self, minutos):
        self.nivel = max(0, self.nivel - minutos)

    def estado(self):
        if self.nivel == 100:
            return "Batería llena"
        if self.nivel == 0:
            return "Batería agotada"
        return f"Batería al {self.nivel} %"


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
