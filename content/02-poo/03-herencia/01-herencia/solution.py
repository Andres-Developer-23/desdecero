class Vehiculo:
    ruedas = 4

    def __init__(self, marca, modelo):
        self.marca = marca
        self.modelo = modelo

    def descripcion(self):
        return f"{self.marca} {self.modelo} ({self.ruedas} ruedas)"


class Moto(Vehiculo):
    ruedas = 2


class Camion(Vehiculo):
    def __init__(self, marca, modelo, carga):
        super().__init__(marca, modelo)
        self.carga = carga

    def descripcion(self):
        return super().descripcion() + f" · carga: {self.carga} t"


flota = [Vehiculo("Renault", "Kangoo"), Moto("Yamaha", "XTZ"), Camion("Volvo", "FH", 12)]
for vehiculo in flota:
    print(vehiculo.descripcion())
