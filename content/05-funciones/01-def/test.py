assert precio_final(80000, 25) == 60000, "precio_final(80000, 25) debería devolver 60000.0. ¿Usas return?"
assert precio_final(100, 0) == 100, "Con un descuento de 0, el precio no debería cambiar"
assert abs(precio_final(59.9, 10) - 53.91) < 0.001, "precio_final(59.9, 10) debería devolver 53.91"
assert precio_final(1000, 100) == 0, "Con un descuento de 100, el precio debería quedar en 0"
