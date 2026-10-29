from fletsim import *

numero = find_one(ft.Text)
assert numero.value == "0", "El contador debería empezar en «0»"
click("Sumar")
click("Sumar")
click("Sumar")
assert numero.value == "3", "Después de pulsar «Sumar» tres veces debería mostrar 3, no " + str(numero.value)
click("Restar")
assert numero.value == "2", "Al pulsar «Restar» debería bajar a 2, no " + str(numero.value)
for _ in range(5):
    click("Restar")
assert numero.value == "0", "El contador no debería bajar de 0; ahora muestra " + str(numero.value)
