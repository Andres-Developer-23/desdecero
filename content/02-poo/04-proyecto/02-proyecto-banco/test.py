assert isinstance(eva, CuentaAhorro) and isinstance(eva, Cuenta) and not isinstance(ana, CuentaAhorro), "abrir_cuenta() debería crear una CuentaAhorro solo si hay tasa"
assert [c.numero for c in banco.cuentas] == [1, 2, 3], "Las cuentas deberían numerarse 1, 2, 3..."
assert luis.saldo == 300 and luis.movimientos == [Movimiento("ingreso", 300)], "Una transferencia fallida no debería cambiar nada en ninguna de las dos cuentas"
for monto in [0, -5]:
    try:
        ana.depositar(monto)
        assert False, "depositar(" + str(monto) + ") debería lanzar ValueError"
    except ValueError:
        pass
try:
    ana.saldo = 10 ** 6
    assert False, "saldo debería ser de solo lectura desde fuera de la cuenta"
except AttributeError:
    pass
nueva = Banco()
otra = nueva.abrir_cuenta("Sol", tasa=0.1)
otra.aplicar_interes()
assert otra.saldo == 0 and otra.movimientos == [], "Con saldo 0, aplicar_interes() no debería añadir ningún movimiento"
