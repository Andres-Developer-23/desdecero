import json

pedidos = [
    '{"id": 101, "cliente": {"nombre": "Ana", "ciudad": "Cali"}, "items": [{"titulo": "Versos para un lunes", "precio": 28500, "cantidad": 2}, {"titulo": "La última estación", "precio": 42000, "cantidad": 1}]}',
    '{"id": 102, "cliente": {"nombre": "Luis", "ciudad": "Pasto"}, "items": [{"titulo": "Un dragón en la biblioteca", "precio": 29900, "cantidad": 3},]}',
    '{"id": 103, "cliente": {"nombre": "Marta", "ciudad": "Bogotá"}, "items": [{"titulo": "Python para curiosos", "precio": 68500, "cantidad": 1}]}',
]

resumenes = []

for posicion, texto in enumerate(pedidos, 1):
    pedido = json.loads(texto)
    # Calcula el total, muestra la línea del pedido y añade su resumen
    # Si el JSON no es válido, explica por qué


# Guarda los resúmenes en pedidos.json, vuelve a leerlo y muestra cuántos hay
