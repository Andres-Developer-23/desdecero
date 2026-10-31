---
title: Leer parámetros de consulta
minutes: 15
summary: Lee los filtros de la URL con request.args, conviértelos con type=int y responde 400 si no valen.
web: http://127.0.0.1:5000/peliculas?genero=animacion
---

En la ruta de APIs pasabas filtros con `params=`: `/v1/libros?categoria=Novela&orden=-precio`. Ahora te toca **leerlos**. Flask pone los datos de la petición en el objeto `request`, que se importa de `flask` y, dentro de una vista, siempre es la petición que se está atendiendo.

Los parámetros de la consulta están en `request.args`, que funciona como un diccionario de textos:

```py
from flask import Flask, request

app = Flask(__name__)


@app.route("/buscar")
def buscar():
    texto = request.args.get("q", "")
    pagina = request.args.get("pagina", 1, type=int)
    etiquetas = request.args.getlist("etiqueta")
    return {"q": texto, "pagina": pagina, "etiquetas": etiquetas}


cliente = app.test_client()
print(cliente.get("/buscar?q=flask&pagina=2").get_json())
print(cliente.get("/buscar?pagina=dos&etiqueta=web&etiqueta=python").get_json())
print(cliente.get("/buscar", query_string={"q": "café con leche"}).get_json())
```

- `request.args.get("q", "")` da el valor, o `""` si no viene.
- Con `type=int`, Flask lo convierte en número. Si no se puede (`pagina=dos`), da el valor por defecto en lugar de fallar.
- `getlist()` recoge un parámetro que se repite (`?etiqueta=web&etiqueta=python`).
- Los valores llegan ya **decodificados**: `caf%C3%A9+con+leche` se lee `café con leche`.

Evita `request.args["q"]`: si el parámetro no viene, Flask responde `400 Bad Request` con una página que no explica nada.

### Validar y responder 400

Si un parámetro es obligatorio o tiene que cumplir algo, compruébalo y responde `400` con un mensaje claro. Para responder con otro código, devuelve una **tupla**: los datos y el código.

```py
from flask import Flask, request

app = Flask(__name__)


@app.route("/pares")
def pares():
    hasta = request.args.get("hasta", type=int)
    if hasta is None or hasta < 1:
        return {"error": "Indica en «hasta» un número entero positivo"}, 400
    return {"pares": [n for n in range(1, hasta + 1) if n % 2 == 0]}


cliente = app.test_client()
print(cliente.get("/pares?hasta=9").get_json())
respuesta = cliente.get("/pares?hasta=nueve")
print(respuesta.status_code, respuesta.get_json())
```

### Filtrar, ordenar y limitar

Con los parámetros ya leídos, filtrar es trabajo de listas, como en cualquier programa: una lista por comprensión para quedarte con lo que cumple el filtro, `sorted()` con `key=` para ordenar y un corte `[:limite]` para no devolverlo todo. Es lo que hacían por dentro las APIs de práctica de la ruta anterior.

## Ejercicio

La lista `PELICULAS` tiene seis películas. Haz que `GET /peliculas` admita estos parámetros, todos opcionales:

- `genero`: solo las películas de ese género, sin distinguir mayúsculas (`Animacion` vale igual que `animacion`);
- `desde`: un año, como número entero; solo las películas de ese año o posteriores;
- `orden`: `anio` o `titulo`, para ordenar por ese campo. Si llega otro valor, responde `400` con `{"error": "orden debe ser anio o titulo"}`;
- `limite`: un número entero, cuántas películas dar como mucho (10 si no se indica).

La respuesta es `{"total": ..., "peliculas": [...]}`: `total` es cuántas películas cumplen los filtros (antes de aplicar el límite), y `peliculas` son sus títulos, ya ordenados y limitados.

## Pista

Empieza con resultado = PELICULAS y ve filtrando: if genero: resultado = [p for p in resultado if p["genero"] == genero.lower()]. Lee desde y limite con request.args.get(..., type=int). Para ordenar: sorted(resultado, key=lambda p: p[orden]). Calcula total antes del corte resultado[:limite].
