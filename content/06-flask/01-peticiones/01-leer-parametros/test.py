cliente = app.test_client()


def pedir(consulta):
    respuesta = cliente.get("/peliculas" + consulta)
    return respuesta.status_code, respuesta.get_json()


estado, datos = pedir("")
assert datos == {"total": 6, "peliculas": [p["titulo"] for p in PELICULAS]}, "Sin parámetros, /peliculas debería dar las 6 películas en su orden"
estado, datos = pedir("?genero=Animacion")
assert datos == {"total": 3, "peliculas": ["El viaje de Chihiro", "Coco", "Encanto"]}, "?genero=Animacion debería dar las 3 de animación (sin distinguir mayúsculas), y da " + str(datos)
estado, datos = pedir("?desde=2015")
assert datos["peliculas"] == ["Coco", "Roma", "Encanto"], "?desde=2015 debería dar las películas de 2015 en adelante, y da " + str(datos)
estado, datos = pedir("?orden=anio&limite=2")
assert datos == {"total": 6, "peliculas": ["El viaje de Chihiro", "El laberinto del fauno"]}, "?orden=anio&limite=2 debería dar las 2 más antiguas con total 6, y da " + str(datos)
estado, datos = pedir("?genero=animacion&orden=titulo")
assert datos["peliculas"] == ["Coco", "El viaje de Chihiro", "Encanto"], "?orden=titulo debería ordenar por título, y da " + str(datos)
estado, datos = pedir("?orden=duracion")
assert estado == 400 and datos == {"error": "orden debe ser anio o titulo"}, "?orden=duracion debería responder 400 con el error del enunciado, y responde " + str(estado)
estado, datos = pedir("?desde=dosmil")
assert datos["total"] == 6, "Si desde no es un número, ignóralo (type=int da None)"
