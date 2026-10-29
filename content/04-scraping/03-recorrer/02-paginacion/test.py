import websim

esperadas = [
    "https://refranes.example/",
    "https://refranes.example/pagina/2/",
    "https://refranes.example/pagina/3/",
    "https://refranes.example/pagina/4/",
]
assert websim.urls_pedidas() == esperadas, "Tu programa debería visitar las 4 páginas en orden, una vez cada una. Visitó: " + ", ".join(websim.urls_pedidas())
