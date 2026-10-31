from flask import Flask, request

app = Flask(__name__)


@app.get("/convertir")
def convertir():
    texto = request.args.get("celsius")
    if texto is None:
        return {"error": "Falta el parámetro celsius"}, 400
    try:
        celsius = float(texto)
    except ValueError:
        return {"error": "celsius tiene que ser un número"}, 400
    return {"celsius": celsius, "fahrenheit": round(celsius * 9 / 5 + 32, 1)}


def probar_api(cliente):
    """Comprueba la API con assert. Recibe un cliente de pruebas."""
    r = cliente.get("/convertir?celsius=100")
    assert r.status_code == 200
    # Añade aquí el resto de las comprobaciones


probar_api(app.test_client())
print("Todas las pruebas pasan")

if __name__ == "__main__":
    app.run(debug=True)
