import websim

assert "https://noticias.example/" in websim.urls_pedidas(), "Tu programa debería pedir https://noticias.example/ con requests.get()"
