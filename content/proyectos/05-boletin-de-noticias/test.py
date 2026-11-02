import json as _json
import websim as _websim

_todas = _websim.peticiones()
assert _todas and _todas[0]["url"] == "https://noticias.example/robots.txt", "Lee primero https://noticias.example/robots.txt con RobotFileParser, antes de pedir ninguna página"
_paginas = [_p for _p in _todas if not _p["url"].endswith("/robots.txt")]
_urls = [_p["url"] for _p in _paginas]
assert _urls[0] == "https://noticias.example/", "La primera página que pides debería ser la portada"
assert len(_urls) == 7 and len(set(_urls)) == 7, "Pide la portada y las 6 noticias, cada una una sola vez. Pediste: " + ", ".join(_urls)
for _peticion in _paginas:
    _agente = _websim.cabecera(_peticion, "User-Agent") or ""
    assert _agente and not _agente.startswith("python-requests"), "Envía la cabecera User-Agent con el nombre de tu bot en cada petición (headers=CABECERAS)"
_segundos = [_p["segundo"] for _p in _paginas]
for _antes, _despues in zip(_segundos, _segundos[1:]):
    assert _despues - _antes >= 1, "Espera al menos 1 segundo después de cada petición con time.sleep(1)"

_boletin = _json.loads(_websim.leer("boletin.json"))
assert isinstance(_boletin, list) and len(_boletin) == 6, "boletin.json debería tener una lista con las 6 noticias"
for _clave in ("titulo", "seccion", "fecha", "autor", "palabras", "url"):
    assert _clave in _boletin[0], "Cada noticia de boletin.json debería tener la clave «" + _clave + "»"
assert _boletin[0]["titulo"] == "La biblioteca municipal abrirá también de noche", "Las noticias de boletin.json deberían ir en el orden de la portada, empezando por «La biblioteca municipal abrirá también de noche»"
assert _boletin[0]["url"] == "https://noticias.example/2026/10/26/la-biblioteca-municipal-abrira-tambien-de-noche.html", "Guarda la dirección completa de cada noticia en «url»"
assert _boletin[1]["palabras"] == 44 and _boletin[1]["fecha"] == "2026-10-25", "La segunda noticia debería tener 44 palabras y la fecha 2026-10-25: " + str(_boletin[1])
