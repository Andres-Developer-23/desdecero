import json

texto = '{"titulo": "Python para curiosos", "autor": "Andrés Quintero", "precio": 68500, "disponible": true, "etiquetas": ["programación", "principiantes"], "descuento": null}'

libro = json.loads(texto)

print("Título:", libro["titulo"])
print("Etiquetas:", len(libro["etiquetas"]))

if libro["descuento"] is None:
    libro["descuento"] = 10
    libro["precio_final"] = libro["precio"] * (100 - libro["descuento"]) // 100

print(json.dumps(libro, indent=2, ensure_ascii=False))
