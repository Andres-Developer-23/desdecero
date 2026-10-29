import websim

todas = websim.peticiones()
assert any(p["url"] == "https://noticias.example/robots.txt" for p in todas), "Lee primero https://noticias.example/robots.txt con RobotFileParser"
paginas = [p for p in todas if not p["url"].endswith("/robots.txt")]
assert not any("/borradores/" in p["url"] for p in paginas), "robots.txt prohíbe /borradores/: tu programa no debería pedir esa página"
assert len(paginas) == 4, "Tu programa debería pedir las 4 direcciones permitidas, y pidió " + str(len(paginas))
for peticion in paginas:
    agente = websim.cabecera(peticion, "User-Agent") or ""
    assert agente.startswith("BotDelCurso"), "Envía la cabecera User-Agent de CABECERAS en cada petición (headers=CABECERAS)"
segundos = [p["segundo"] for p in paginas]
for antes, despues in zip(segundos, segundos[1:]):
    assert despues - antes >= 1, "Espera al menos 1 segundo entre una petición y la siguiente con time.sleep(1)"
