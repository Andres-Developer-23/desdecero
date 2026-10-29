import websim

urls = websim.urls_pedidas()
assert len(urls) == 2, "Basta con 2 peticiones: los libros y las tasas. Tu programa hizo " + str(len(urls))
assert any("/v1/tasas" in url and "base=COP" in url for url in urls), "Pide las tasas con base COP a https://api.cambio.example/v1/tasas"
