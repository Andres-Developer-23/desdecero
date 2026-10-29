from fletsim import *

assert page().title == "Mi primera app", "El título de la ventana debería ser «Mi primera app» (page.title)"
assert texts() == ["Hola, Flet", "Estoy aprendiendo a crear apps"], "La app debería mostrar los dos textos en orden. Ahora muestra: " + str(texts())
