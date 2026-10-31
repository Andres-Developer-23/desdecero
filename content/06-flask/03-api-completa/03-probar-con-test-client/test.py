from flask import Flask as _Flask, request as _request


def _version_rota(cambio):
    rota = _Flask(__name__)

    @rota.route("/convertir", methods=["GET", "POST"] if cambio == "post" else ["GET"])
    def convertir():
        texto = _request.args.get("celsius")
        if texto is None:
            if cambio == "falta":
                return {"celsius": 0.0, "fahrenheit": 32.0}
            return {"error": "x"}, 400
        try:
            celsius = float(texto)
        except ValueError:
            if cambio == "texto":
                return {"celsius": 0.0, "fahrenheit": 32.0}
            return {"error": "x"}, 400
        if cambio == "formula":
            return {"celsius": celsius, "fahrenheit": round(celsius * 9 / 5, 1)}
        if cambio == "negativos":
            return {"celsius": celsius, "fahrenheit": round(abs(celsius) * 9 / 5 + 32, 1)}
        return {"celsius": celsius, "fahrenheit": round(celsius * 9 / 5 + 32, 1)}

    return rota


for _cambio, _fallo in [
    ("formula", "la fórmula está mal (100 °C dan 180.0 en lugar de 212.0)"),
    ("negativos", "las temperaturas bajo cero salen mal"),
    ("falta", "sin celsius responde 200 en lugar de 400"),
    ("texto", "con celsius=abc responde 200 en lugar de 400"),
    ("post", "acepta POST en lugar de responder 405"),
]:
    try:
        probar_api(_version_rota(_cambio).test_client())
    except AssertionError:
        continue
    raise AssertionError("Tus pruebas no detectan una versión rota de la API en la que " + _fallo)
