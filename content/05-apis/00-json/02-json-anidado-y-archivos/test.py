import json
import websim

guardados = json.loads(websim.leer("pedidos.json"))
esperados = [
    {"id": 101, "cliente": "Ana", "total": 99000},
    {"id": 103, "cliente": "Marta", "total": 68500},
]
assert guardados == esperados, "pedidos.json debería tener " + json.dumps(esperados, ensure_ascii=False) + " y tiene " + json.dumps(guardados, ensure_ascii=False)
