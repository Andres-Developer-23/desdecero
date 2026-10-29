"""
Ayudas para comprobar los ejercicios de web scraping en el simulador.

Las usan los test.py de la ruta de scraping: revisan qué páginas pidió el
programa del alumno, con qué cabeceras y pausas, y qué archivos guardó.
"""

import csv

import _web


def peticiones():
    """Peticiones de esta ejecución, en orden: [{"url", "estado", "segundo", "cabeceras"}]."""
    result = []
    for item in _web.requests_log():
        result.append(
            {
                "url": item["url"],
                "estado": item["status"],
                "segundo": item["time"],
                "cabeceras": item["headers"],
            }
        )
    return result


def urls_pedidas():
    """Las URL pedidas, en orden y con repeticiones."""
    return [item["url"] for item in peticiones()]


def pausas():
    """Segundos entre el comienzo de cada petición y el de la siguiente."""
    tiempos = [item["segundo"] for item in peticiones()]
    return [round(tiempos[i + 1] - tiempos[i], 3) for i in range(len(tiempos) - 1)]


def cabecera(peticion, nombre):
    """El valor de una cabecera de una petición, sin distinguir mayúsculas, o None."""
    for clave in peticion["cabeceras"]:
        if clave.lower() == nombre.lower():
            return peticion["cabeceras"][clave]
    return None


def archivos():
    """Nombres de los archivos que guardó el programa."""
    return sorted(_web.file_names())


def leer(nombre):
    """El texto de un archivo guardado, o un error que explica que no existe."""
    texto = _web.file_read(nombre)
    if texto is None:
        guardados = archivos()
        detalle = ", ".join(guardados) if guardados else "ninguno"
        raise AssertionError(
            "Tu programa no guardó el archivo «" + nombre + "». Archivos guardados: " + detalle
        )
    return texto


def filas_csv(nombre):
    """Las filas de un CSV guardado, como diccionarios (con csv.DictReader)."""
    lineas = leer(nombre).replace("\r\n", "\n").split("\n")
    if lineas and lineas[-1] == "":
        lineas.pop()
    return list(csv.DictReader(lineas))
