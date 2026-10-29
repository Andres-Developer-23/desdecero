assert issubclass(Moto, Vehiculo) and issubclass(Camion, Vehiculo), "Moto y Camion deberían heredar de Vehiculo: class Moto(Vehiculo)"
assert "descripcion" not in Moto.__dict__, "Moto no necesita su propio descripcion(): basta con cambiar ruedas"
camion = Camion("Scania", "R", 30)
assert camion.marca == "Scania" and camion.modelo == "R" and camion.carga == 30, "Camion debería guardar marca y modelo con super().__init__(marca, modelo), y además carga"
assert camion.descripcion() == "Scania R (4 ruedas) · carga: 30 t", "La descripción del camión no es correcta: " + repr(camion.descripcion())
