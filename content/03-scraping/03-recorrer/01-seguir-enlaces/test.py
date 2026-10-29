import websim

fichas = [url for url in websim.urls_pedidas() if "/libro/" in url]
assert len(fichas) == 6, "Tu programa debería visitar la página de los 6 libros, y visitó " + str(len(fichas))
assert fichas[0] == "https://libreria.example/libro/el-faro-de-la-niebla.html", "Convierte cada enlace en una dirección completa con urljoin(), por ejemplo https://libreria.example/libro/el-faro-de-la-niebla.html"
