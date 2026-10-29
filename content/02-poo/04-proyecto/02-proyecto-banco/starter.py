from dataclasses import dataclass


@dataclass
class Movimiento:
    tipo: str
    monto: int


class SaldoInsuficiente(Exception):
    def __init__(self, saldo, monto):
        super().__init__(f"Saldo insuficiente: tienes {saldo} y quieres retirar {monto}")
        self.saldo = saldo
        self.monto = monto


class Cuenta:
    def __init__(self, numero, titular):
        self.numero = numero
        self.titular = titular
        self._saldo = 0
        self.movimientos = []

    @property
    def saldo(self):
        return self._saldo

    # Escribe aquí depositar, retirar y __str__


class CuentaAhorro(Cuenta):
    pass  # escribe aquí __init__ y aplicar_interes


class Banco:
    def __init__(self):
        self.cuentas = []

    # Escribe aquí abrir_cuenta, transferir y total


banco = Banco()
ana = banco.abrir_cuenta("Ana")
luis = banco.abrir_cuenta("Luis")
eva = banco.abrir_cuenta("Eva", tasa=0.02)

ana.depositar(1500)
eva.depositar(2000)
banco.transferir(ana, luis, 300)
try:
    banco.transferir(luis, eva, 800)
except SaldoInsuficiente as error:
    print("Error:", error)
eva.aplicar_interes()

for cuenta in banco.cuentas:
    print(cuenta)
print("Total:", banco.total())
detalle = ", ".join(f"{m.tipo} {m.monto}" for m in ana.movimientos)
print("Movimientos de Ana:", detalle)
