---
title: Proteger la API con un token
minutes: 18
summary: Un inicio de sesión que da un token, y un decorador que lo exige en las rutas privadas.
web: http://127.0.0.1:5000/entradas
---

Hasta ahora, cualquiera podía usar tus APIs. Para datos privados, la API necesita saber **quién** hace cada petición (autenticación) y si **puede** hacerlo (autorización). Es lo que hacía la API de tareas de la ruta anterior con su token: ahora lo construyes tú.

### El flujo del token

1. El cliente inicia sesión: `POST /login` con su usuario y su clave.
2. Si son correctos, el servidor responde un **token**, una llave temporal.
3. En cada petición privada, el cliente envía la cabecera `Authorization: Bearer <token>`.
4. El servidor busca a quién pertenece el token. Si falta o no vale, responde `401 Unauthorized` con la cabecera `WWW-Authenticate: Bearer`, que indica qué tipo de credencial espera.

### Leer el token

Flask ya interpreta la cabecera en `request.authorization`: `None` si no viene, y si viene, su tipo (`"bearer"`, en minúsculas) y el token:

```py
from flask import Flask, request

app = Flask(__name__)


@app.get("/quien-soy")
def quien_soy():
    auth = request.authorization
    if auth is None:
        return {"error": "Falta el token"}, 401, {"WWW-Authenticate": "Bearer"}
    return {"tipo": auth.type, "token": auth.token}


cliente = app.test_client()
print(cliente.get("/quien-soy", headers={"Authorization": "Bearer abc123"}).get_json())
r = cliente.get("/quien-soy")
print(r.status_code, r.headers["WWW-Authenticate"], r.get_json())
```

### Un decorador para todas las rutas privadas

Repetir esa comprobación en cada vista sería un error esperando a ocurrir: basta olvidarla en una. Mejor escribir un **decorador**, como los de Flask, que envuelve la vista y solo la llama si el token es válido:

```py
from functools import wraps

from flask import Flask, request

app = Flask(__name__)
TOKENS = {"tk-123": "ana"}


def requiere_token(vista):
    @wraps(vista)
    def envoltura(*args, **kwargs):
        auth = request.authorization
        if auth is None or auth.type != "bearer" or auth.token not in TOKENS:
            return {"error": "Necesitas un token válido"}, 401, {"WWW-Authenticate": "Bearer"}
        return vista(TOKENS[auth.token], *args, **kwargs)

    return envoltura


@app.get("/perfil")
@requiere_token
def perfil(usuario):
    return {"usuario": usuario}


@app.get("/saludo/<nombre>")
@requiere_token
def saludo(usuario, nombre):
    return {"mensaje": f"{usuario} saluda a {nombre}"}


cliente = app.test_client()
cabeceras = {"Authorization": "Bearer tk-123"}
print(cliente.get("/perfil", headers=cabeceras).get_json())
print(cliente.get("/saludo/Luis", headers=cabeceras).get_json())
print(cliente.get("/perfil").status_code)
```

- `envoltura` recibe los argumentos de la ruta (`nombre`) y se los pasa a la vista, junto con el usuario del token.
- `@app.get(...)` va **encima** de `@requiere_token`: Flask registra la vista ya protegida.
- `@wraps(vista)` copia el nombre de la vista en `envoltura`. Sin él, todas las vistas protegidas se llamarían `envoltura`, y Flask se negaría a registrar la segunda (`View function mapping is overwriting an existing endpoint function`).

### En un proyecto real

Este es el esqueleto de la idea; en producción se añade más:

- las claves no se guardan tal cual, sino con un **hash** (por ejemplo, con `werkzeug.security.generate_password_hash`);
- los tokens se generan al azar (`secrets.token_hex(16)`) y **caducan**;
- todo viaja por **HTTPS**, para que nadie pueda leer el token por el camino.

## Ejercicio

Termina el diario privado. Cada persona solo puede ver y escribir sus entradas.

- `POST /login`: recibe `{"usuario": ..., "clave": ...}`. Si son correctos (según `USUARIOS`), responde `{"token": ...}` con el token de esa persona (en `TOKENS`, el token cuyo valor es ese usuario). Si no, `401` con `{"error": "Usuario o clave incorrectos"}`.
- `requiere_token(vista)`: si no llega un token Bearer, responde `401` con `{"error": "Falta el token"}`; si llega pero no está en `TOKENS`, `401` con `{"error": "Token no válido"}`. Las dos respuestas, con la cabecera `WWW-Authenticate: Bearer`. Si es válido, llama a la vista con el usuario como primer argumento. Usa `@wraps`.
- `GET /entradas` (protegida): las entradas del usuario, como `[{"id": ..., "texto": ...}]`.
- `POST /entradas` (protegida): crea una entrada con el `texto` que llega (id: el mayor más uno). Si el texto no es un texto con algo escrito, `422` con `{"error": "El texto no puede estar vacío"}`. Si va bien, `201` con `{"id": ..., "texto": ...}`.

## Pista

Para el token del login: next(token for token, nombre in TOKENS.items() if nombre == usuario). En el decorador: auth = request.authorization; si auth is None or auth.type != "bearer", el primer error; si auth.token not in TOKENS, el segundo; si no, return vista(TOKENS[auth.token], *args, **kwargs). Pon @app.get("/entradas") encima de @requiere_token.
