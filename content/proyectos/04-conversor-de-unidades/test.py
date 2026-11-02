from fletsim import *

campo = find_one(ft.TextField)
assert "1000 mm" in texts() and "0.001 km" in texts(), "Al abrir la app, con 1 m, deberían verse sus equivalencias, como «1000 mm» y «0.001 km». Se ve: " + str(texts())
assert "1 m" not in texts(), "La unidad de origen no debería aparecer entre los resultados"

type_text(campo, "5")
click("km")
for esperado in ["5000 m", "500000 cm", "3.1069 mi", "16404.1995 ft"]:
    assert esperado in texts(), "5 km deberían dar «" + esperado + "». Se ve: " + str(texts())

type_text(campo, "2,5")
assert "2500 m" in texts(), "Acepta también la coma decimal: 2,5 km son 2500 m. Se ve: " + str(texts())

type_text(campo, "diez")
assert campo.error == "Escribe un número", "Si el valor no es un número, el campo debería mostrar el error «Escribe un número»"
assert not [t for t in texts() if t.endswith(" m")], "Si el valor no es un número no debería haber resultados"

type_text(campo, "100")
assert campo.error is None, "Cuando el valor vuelve a ser un número, el error debería desaparecer"

click("Temperatura")
assert "212 °F" in texts() and "373.15 K" in texts(), "Al elegir Temperatura, la unidad debería ser °C: 100 °C son 212 °F y 373.15 K. Se ve: " + str(texts())
click("°F")
type_text(campo, "32")
assert "0 °C" in texts() and "273.15 K" in texts(), "32 °F deberían dar 0 °C y 273.15 K. Se ve: " + str(texts())
type_text(campo, "-40")
assert "-40 °C" in texts(), "-40 °F son -40 °C. Se ve: " + str(texts())

click("Peso")
type_text(campo, "1")
click("lb")
for esperado in ["453.5924 g", "0.4536 kg", "16 oz"]:
    assert esperado in texts(), "1 lb debería dar «" + esperado + "». Se ve: " + str(texts())

type_text(campo, "")
assert not [t for t in texts() if t.endswith(" kg")], "Con el campo vacío no debería haber resultados"
assert campo.error is None, "Un campo vacío no es un error: solo no hay nada que convertir"
