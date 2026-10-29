import websim
from urllib.parse import parse_qs, urlparse

busquedas = [p["url"] for p in websim.peticiones() if urlparse(p["url"]).path == "/v1/libros"]
assert busquedas, "Busca los libros en https://api.libreria.example/v1/libros"
consulta = parse_qs(urlparse(busquedas[-1]).query)
assert consulta.get("disponible") == ["true"], "Filtra los libros disponibles con disponible=true"
assert consulta.get("precio_max") == ["50000"], "Filtra por precio con precio_max=50000"
assert consulta.get("orden") == ["precio"], "Ordena del más barato al más caro con orden=precio"
assert "https://api.libreria.example/v1/libros/5" in websim.urls_pedidas(), "Pide los datos completos del libro más barato con su id"
