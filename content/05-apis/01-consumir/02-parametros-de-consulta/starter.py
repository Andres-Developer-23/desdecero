import requests

URL = "https://api.libreria.example/v1/libros"

# 1. Busca los libros disponibles de 50000 pesos o menos, del más barato al más caro
respuesta = requests.get(URL)
datos = respuesta.json()

print("Encontrados:", datos["total"])

# 2. Muestra cada uno con su precio

# 3. Pide los datos completos del más barato y muestra su editorial y sus páginas
