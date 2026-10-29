try:
    Figura()
    assert False, "Figura debería ser abstracta: hereda de ABC y marca area y perimetro con @abstractmethod"
except TypeError:
    pass
assert isinstance(Cuadrado(1), Rectangulo), "Cuadrado debería heredar de Rectangulo"
assert "area" not in Cuadrado.__dict__, "Cuadrado no necesita su propio area(): hereda el de Rectangulo"
assert Rectangulo(5, 2).perimetro() == 14, "El perímetro de un rectángulo de 5 x 2 es 14"
