import requests

respuesta = requests.get("https://noticias.example/")
print(respuesta.status_code)
print(respuesta.headers["Content-Type"])
print(len(respuesta.text))
