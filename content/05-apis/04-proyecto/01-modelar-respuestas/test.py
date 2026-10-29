import json
import websim

ejemplo = Libro.desde_json({"id": 1, "titulo": "A", "autor": "B", "precio": 10, "valoracion": 5, "disponible": False, "url": "x", "moneda": "COP", "categoria": "C"})
assert ejemplo == Libro(1, "A", "B", 10, 5, False), "Libro.desde_json() debería crear el libro con sus seis campos e ignorar los demás"
assert not ejemplo.destacado, "Un libro agotado no es destacado aunque tenga valoración 5"
assert all(isinstance(libro, Libro) for libro in libros), "libros debería ser una lista de objetos Libro"
guardados = json.loads(websim.leer("destacados.json"))
assert [libro["id"] for libro in guardados] == [2, 6, 7, 15], "destacados.json debería tener los libros 2, 6, 7 y 15"
assert set(guardados[0]) == {"id", "titulo", "autor", "precio", "valoracion", "disponible"}, "Guarda cada destacado con asdict()"
assert len(websim.urls_pedidas()) == 2, "Con 10 libros por página bastan 2 peticiones"
