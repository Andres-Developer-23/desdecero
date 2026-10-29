assert isinstance(libro, dict), "libro debería ser un diccionario: conviértelo con json.loads(texto)"
assert libro["precio_final"] == 61650, "precio_final debería ser 61650"
