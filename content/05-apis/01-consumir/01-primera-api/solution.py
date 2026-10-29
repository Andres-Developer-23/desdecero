import requests

respuesta = requests.get("https://api.libreria.example/v1/categorias")
categorias = respuesta.json()

total = 0
for categoria in categorias:
    print(f"{categoria['nombre']}: {categoria['libros']}")
    total += categoria["libros"]

print(f"Total: {total} libros en {len(categorias)} categorías")
