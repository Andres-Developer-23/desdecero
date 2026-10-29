antes = Usuario.total
nuevo = Usuario.desde_texto("  Eva Mora , 18 ")
assert isinstance(nuevo, Usuario), "desde_texto() debería devolver un Usuario"
assert nuevo.nombre == "Eva Mora" and nuevo.edad == 18, "desde_texto(\"  Eva Mora , 18 \") debería dar nombre \"Eva Mora\" y edad 18, sin espacios de más"
assert Usuario.total == antes + 1, "Cada usuario nuevo debería sumar 1 a Usuario.total"
assert Usuario.es_mayor_de_edad(18) is True and Usuario.es_mayor_de_edad(17) is False, "es_mayor_de_edad() debería ser True desde los 18 años"
