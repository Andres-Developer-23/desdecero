import websim

urls = websim.urls_pedidas()
assert len(urls) == 4, "Con 5 libros por página hay que hacer 4 peticiones, y tu programa hizo " + str(len(urls))
assert "por_pagina=5" in urls[0], "Pide 5 libros por página con por_pagina=5"
assert len(set(urls)) == 4, "Pide cada página una sola vez"
