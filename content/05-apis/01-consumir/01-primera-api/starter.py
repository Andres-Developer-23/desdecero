import requests

respuesta = requests.get("https://api.libreria.example/")

# Pide /v1/categorias, recorre la lista y muestra cada categoría
print(respuesta.status_code)
