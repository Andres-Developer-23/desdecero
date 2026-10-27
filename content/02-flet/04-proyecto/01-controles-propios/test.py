from fletsim import *

marcadores = find(Marcador)
assert len(marcadores) == 2, "La app debería mostrar dos Marcador; ahora hay " + str(len(marcadores))
rojos, azules = marcadores
assert rojos.equipo == "Rojos" and rojos.puntos == 0, "El primer marcador debería ser Marcador(equipo=\"Rojos\"), con 0 puntos"
assert azules.equipo == "Azules" and azules.puntos == 3, "El segundo debería ser Marcador(equipo=\"Azules\", puntos=3)"

def textos(marcador):
    return [c.value for c in marcador.controls if isinstance(c, ft.Text)]

assert textos(rojos) == ["Rojos", "0"], "El marcador de los Rojos debería mostrar «Rojos» y «0». Ahora: " + str(textos(rojos))
assert textos(azules) == ["Azules", "3"], "El de los Azules debería mostrar «Azules» y «3». Ahora: " + str(textos(azules))
boton = find_one(ft.IconButton, icon=ft.Icons.ADD)
click(boton)
click(boton)
assert textos(rojos)[1] == "2", "Pulsar dos veces el + de los Rojos debería dejarlos en 2"
assert textos(azules)[1] == "3", "Los puntos de cada marcador deberían ser independientes"
