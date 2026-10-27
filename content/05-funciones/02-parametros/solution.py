def convertir(cantidad, moneda="USD"):
    tasas = {"USD": 4000, "EUR": 4400}
    if moneda not in tasas:
        return None
    return round(cantidad / tasas[moneda], 2)

print(convertir(100000))
print(convertir(100000, "EUR"))
print(convertir(5000, "JPY"))
