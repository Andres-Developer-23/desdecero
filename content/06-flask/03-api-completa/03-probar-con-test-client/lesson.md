---
title: Probar la API con test_client
minutes: 15
summary: Escribe pruebas automáticas que comprueben tu API sin arrancar el servidor, y que de verdad detecten fallos.
web: http://127.0.0.1:5000/convertir?celsius=100
---

Cada vez que cambias algo en tu API, ¿cómo sabes que no has roto otra cosa? Probar a mano todas las rutas en el navegador es lento y se olvida algo. Lo profesional es escribir **pruebas automáticas**: código que hace peticiones a tu API y comprueba las respuestas con `assert`.

### El cliente de pruebas

Ya lo has usado en los ejemplos. `app.test_client()` hace peticiones a la aplicación **sin servidor**, directamente:

```txt
cliente = app.test_client()
cliente.get("/ruta", query_string={"q": "x"}, headers={"Authorization": "Bearer abc"})
cliente.post("/ruta", json={"nombre": "Ana"})
cliente.put(...), cliente.patch(...), cliente.delete(...)
```

Y la respuesta tiene lo que necesitas comprobar:

- `status_code` (`201`) y `status` (`"201 CREATED"`);
- `get_json()`: el cuerpo JSON ya convertido;
- `get_data(as_text=True)`: el cuerpo como texto;
- `headers`: las cabeceras, como `headers["Location"]`.

### Escribir pruebas

Cada prueba es una función que prepara una petición y comprueba la respuesta. Comprueba siempre el **código** y el **contenido**, y prueba también los casos de error, que es donde más fallan las APIs:

```py
from flask import Flask, request

app = Flask(__name__)


@app.get("/sumar")
def sumar():
    a = request.args.get("a", type=int)
    b = request.args.get("b", type=int)
    if a is None or b is None:
        return {"error": "Faltan a o b"}, 400
    return {"resultado": a + b}


def probar_suma(cliente):
    r = cliente.get("/sumar?a=2&b=3")
    assert r.status_code == 200
    assert r.get_json() == {"resultado": 5}


def probar_faltan_datos(cliente):
    r = cliente.get("/sumar?a=2")
    assert r.status_code == 400
    assert "error" in r.get_json()


cliente = app.test_client()
for prueba in [probar_suma, probar_faltan_datos]:
    prueba(cliente)
    print("✓", prueba.__name__)
```

Si una comprobación falla, `assert` lanza `AssertionError` y sabes exactamente qué se rompió.

### ¿Tus pruebas detectan fallos?

Que las pruebas pasen no basta: tienen que **fallar cuando la API está mal**. Una prueba que solo mira `status_code == 200` no notaría que la suma da un resultado equivocado. Una buena forma de comprobarlo es romper la API a propósito y ver si alguna prueba se queja. Es justo lo que hará la comprobación de este ejercicio con tus pruebas.

### Modo testing

Con `app.testing = True` (o en modo debug), si una vista lanza una excepción, el cliente de pruebas la recibe en lugar de un `500`, y ves en qué línea falló. En proyectos reales, las pruebas van en archivos aparte (`test_api.py`) y se ejecutan con **pytest**, que encuentra y ejecuta solo las funciones que empiezan por `test_`.

## Ejercicio

La API de conversión de temperaturas ya está hecha: no la cambies. Escribe la función `probar_api(cliente)`, que use el cliente que recibe para comprobar con `assert` que:

1. `GET /convertir?celsius=100` responde `200` con `{"celsius": 100.0, "fahrenheit": 212.0}`.
2. `GET /convertir?celsius=-40` da `-40.0` grados Fahrenheit.
3. `GET /convertir` sin `celsius` responde `400`.
4. `GET /convertir?celsius=abc` responde `400`.
5. `POST /convertir` responde `405`.

La comprobación ejecutará tus pruebas con esta API, donde tienen que pasar, y con versiones rotas de ella, donde alguna tiene que fallar.

## Pista

Cada punto son dos líneas: r = cliente.get("/convertir?celsius=-40") y assert r.get_json()["fahrenheit"] == -40.0. Para el 405 usa cliente.post("/convertir"). Usa siempre el cliente que recibe la función, no app.test_client(): así se puede probar con otras versiones de la API.
