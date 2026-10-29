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

    def depositar(self, monto):
        if monto <= 0:
            raise ValueError("El monto debe ser positivo")
        self._saldo += monto
        self.movimientos.append(Movimiento("ingreso", monto))

    def retirar(self, monto):
        if monto <= 0:
            raise ValueError("El monto debe ser positivo")
        if monto > self._saldo:
            raise SaldoInsuficiente(self._saldo, monto)
        self._saldo -= monto
        self.movimientos.append(Movimiento("retiro", monto))

    def __str__(self):
        return f"Cuenta {self.numero} de {self.titular} · saldo: {self._saldo}"


class CuentaAhorro(Cuenta):
    def __init__(self, numero, titular, tasa):
        super().__init__(numero, titular)
        self.tasa = tasa

    def aplicar_interes(self):
        interes = round(self.saldo * self.tasa)
        if interes > 0:
            self.depositar(interes)


class Banco:
    def __init__(self):
        self.cuentas = []

    def abrir_cuenta(self, titular, tasa=None):
        numero = len(self.cuentas) + 1
        if tasa is None:
            cuenta = Cuenta(numero, titular)
        else:
            cuenta = CuentaAhorro(numero, titular, tasa)
        self.cuentas.append(cuenta)
        return cuenta

    def transferir(self, origen, destino, monto):
        origen.retirar(monto)
        destino.depositar(monto)

    def total(self):
        return sum(cuenta.saldo for cuenta in self.cuentas)


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
