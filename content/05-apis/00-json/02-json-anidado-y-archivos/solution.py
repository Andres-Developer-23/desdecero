import json

pedidos = [
    '{"id": 101, "cliente": {"nombre": "Ana", "ciudad": "Cali"}, "items": [{"titulo": "Versos para un lunes", "precio": 28500, "cantidad": 2}, {"titulo": "La última estación", "precio": 42000, "cantidad": 1}]}',
    '{"id": 102, "cliente": {"nombre": "Luis", "ciudad": "Pasto"}, "items": [{"titulo": "Un dragón en la biblioteca", "precio": 29900, "cantidad": 3},]}',
    '{"id": 103, "cliente": {"nombre": "Marta", "ciudad": "Bogotá"}, "items": [{"titulo": "Python para curiosos", "precio": 68500, "cantidad": 1}]}',
]

resumenes = []

for posicion, texto in enumerate(pedidos, 1):
    try:
        pedido = json.loads(texto)
    except json.JSONDecodeError as error:
        print(f"Pedido en la posición {posicion}: JSON no válido ({error.msg}, columna {error.colno})")
        continue

    total = 0
    for item in pedido["items"]:
        total += item["precio"] * item["cantidad"]
    cliente = pedido["cliente"]
    print(f"Pedido {pedido['id']} · {cliente['nombre']} ({cliente['ciudad']}) · total {total}")
    resumenes.append({"id": pedido["id"], "cliente": cliente["nombre"], "total": total})

with open("pedidos.json", "w", encoding="utf-8") as archivo:
    json.dump(resumenes, archivo, indent=2, ensure_ascii=False)

with open("pedidos.json", encoding="utf-8") as archivo:
    guardados = json.load(archivo)

print("Guardados:", len(guardados))
