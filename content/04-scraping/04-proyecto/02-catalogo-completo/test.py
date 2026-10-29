import websim

urls = websim.urls_pedidas()
catalogo = [u for u in urls if "/libro/" not in u]
fichas = [u for u in urls if "/libro/" in u]
assert catalogo == ["https://libreria.example/", "https://libreria.example/catalogo/pagina-2.html", "https://libreria.example/catalogo/pagina-3.html"], "Recorre las 3 páginas del catálogo siguiendo «Siguiente». Visitaste: " + ", ".join(catalogo)
assert len(fichas) == 18 and len(set(fichas)) == 18, "Visita la ficha de cada uno de los 18 libros una sola vez"
for pausa in websim.pausas():
    assert pausa >= 1, "Haz todas las peticiones con descargar(), que espera 1 segundo después de cada una"
filas = websim.filas_csv("libros.csv")
assert len(filas) == 18, "libros.csv debería tener 18 libros, y tiene " + str(len(filas))
assert list(filas[0].keys()) == ["titulo", "autor", "precio", "estrellas", "categoria", "ejemplares"], "Las columnas de libros.csv deberían ser titulo, autor, precio, estrellas, categoria y ejemplares"
assert filas[0] == {"titulo": "El faro de la niebla", "autor": "Marta Ibáñez", "precio": "45900", "estrellas": "4", "categoria": "Novela", "ejemplares": "7"}, "La primera fila de libros.csv no es correcta: " + str(filas[0])
assert filas[2]["ejemplares"] == "0", "Los libros agotados deberían tener 0 ejemplares"
assert filas[11]["titulo"] == "Los puentes de piedra y otras crónicas de viaje por la cordillera", "Usa el título completo del <h1> de cada ficha"
