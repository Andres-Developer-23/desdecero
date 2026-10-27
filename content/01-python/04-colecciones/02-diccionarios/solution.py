precios = {"café": 4500, "pan": 1200, "leche": 3800, "huevos": 600}
carrito = ["café", "pan", "pan", "leche", "huevos", "huevos", "huevos", "pan"]

total = 0
for producto in carrito:
    total += precios[producto]

print(f"Total: {total}")
