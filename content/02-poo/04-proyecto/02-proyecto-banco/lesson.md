---
title: "Proyecto: un banco"
minutes: 30
summary: Un programa completo con clases de datos, propiedades, herencia, composición y excepciones propias.
---

Es hora de juntarlo todo en un programa de verdad: un pequeño banco. Antes de escribir código, el diseño. Esta es la parte más importante de la programación orientada a objetos: decidir qué clases hay y de qué se encarga cada una.

- **`Movimiento`** (clase de datos): un ingreso o un retiro, con su tipo y su monto. Solo guarda datos, así que `@dataclass` es perfecta.
- **`Cuenta`**: tiene un titular, un saldo que **no se puede tocar desde fuera** (una propiedad de solo lectura) y una lista de movimientos. Sabe `depositar` y `retirar`, y se niega con un error si el monto no es válido o no hay saldo.
- **`CuentaAhorro`**: **es una** cuenta (herencia) que además genera intereses.
- **`Banco`**: **tiene** cuentas (composición). Las abre, las numera y hace transferencias entre ellas.
- **`SaldoInsuficiente`**: el error con nombre propio de este programa.

Un detalle importante es la **transferencia**: sacar dinero de una cuenta y ponerlo en otra. Si el retiro falla por falta de saldo, el depósito no debe ocurrir. Por eso conviene retirar primero y depositar después: si `retirar` lanza la excepción, la línea siguiente no se ejecuta y nada cambia. A esa idea, «o se hace todo o no se hace nada», se le llama **atomicidad**, y es la base de cualquier sistema que mueve dinero.

Repaso rápido de lo que vas a usar:

```py
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
    def __init__(self, titular):
        self.titular = titular
        self._saldo = 0

    @property
    def saldo(self):
        return self._saldo


cuenta = Cuenta("Ana")
print(cuenta.saldo, Movimiento("ingreso", 500))
try:
    raise SaldoInsuficiente(100, 500)
except SaldoInsuficiente as error:
    print(error)
```

Si te atascas, vuelve a la lección de cada tema: propiedades, herencia, composición o excepciones.

## Ejercicio

Termina el banco. El código de partida ya trae `Movimiento`, `SaldoInsuficiente` y el esqueleto de las clases.

En `Cuenta`:

- `depositar(monto)` y `retirar(monto)`: si el monto no es mayor que 0, lanzan `ValueError("El monto debe ser positivo")`. Si se retira más que el saldo, `retirar` lanza `SaldoInsuficiente(saldo, monto)`. Si todo va bien, cambian el saldo y añaden un `Movimiento("ingreso", monto)` o `Movimiento("retiro", monto)` a `movimientos`.
- `__str__`: devuelve `"Cuenta 1 de Ana · saldo: 1500"`.

En `CuentaAhorro`, que hereda de `Cuenta`:

- Su `__init__` recibe además `tasa` (por ejemplo, `0.02` es un 2 %).
- `aplicar_interes()` deposita `round(saldo * tasa)` si es mayor que 0.

En `Banco`:

- `abrir_cuenta(titular, tasa=None)`: crea una `Cuenta` o, si hay tasa, una `CuentaAhorro`; le da el número siguiente (1, 2, 3...); la guarda y la devuelve.
- `transferir(origen, destino, monto)`: retira de una y deposita en la otra. Si el retiro falla, no cambia nada.
- `total()`: devuelve la suma de los saldos.

Con el programa de abajo, la salida debería ser:

```txt
Error: Saldo insuficiente: tienes 300 y quieres retirar 800
Cuenta 1 de Ana · saldo: 1200
Cuenta 2 de Luis · saldo: 300
Cuenta 3 de Eva · saldo: 2040
Total: 3540
Movimientos de Ana: ingreso 1500, retiro 300
```

## Pista

En transferir basta con origen.retirar(monto) y después destino.depositar(monto): si retirar lanza la excepción, el depósito no llega a ejecutarse. En CuentaAhorro, llama a super().__init__(numero, titular) y guarda self.tasa.
