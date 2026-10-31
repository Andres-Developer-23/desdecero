---
title: Claves de acceso
minutes: 14
summary: Envía una clave de acceso en las cabeceras, entiende los errores 401 y 403 y usa una sesión.
web: https://api.clima.example/
---

Muchas APIs no son de libre acceso: piden una **clave** (*API key*), un texto largo que te dan al registrarte. Con ella el servicio sabe quién hace cada petición, puede cobrar por uso o limitar cuántas haces.

La API del clima del curso, [api.clima.example](https://api.clima.example/), pide clave en todas sus rutas de `/v1`. Su dirección base te da una de prueba: `demo-clima-2026`.

### Enviar la clave en una cabecera

Además de la URL, cada petición lleva **cabeceras** (*headers*): datos sobre la propia petición, como qué programa la hace (`User-Agent`) o qué formato acepta. Las claves de acceso suelen ir en una cabecera; esta API usa `X-API-Key`. En requests, las cabeceras se pasan como diccionario con `headers=`:

```py
import requests

CLAVE = "demo-clima-2026"

respuesta = requests.get(
    "https://api.clima.example/v1/actual",
    params={"ciudad": "Bogotá"},
    headers={"X-API-Key": CLAVE},
)
print(respuesta.status_code)
print(respuesta.json())
```

En la pestaña **web**, al desplegar *detalles de la petición y la respuesta*, verás `X-API-Key` entre las cabeceras de la petición.

### 401 y 403

Sin clave, o con una que no existe, la API responde **401 Unauthorized**: no sabe quién eres. Con una clave válida pero sin permiso (por ejemplo, una clave desactivada) responde **403 Forbidden**: sabe quién eres, pero no te deja.

```py
import requests

URL = "https://api.clima.example/v1/actual?ciudad=Cali"
for clave in [None, "inventada", "clave-antigua-2019", "demo-clima-2026"]:
    cabeceras = {"X-API-Key": clave} if clave else {}
    respuesta = requests.get(URL, headers=cabeceras)
    print(clave, "→", respuesta.status_code, respuesta.reason)
```

### Una sesión para no repetir la clave

Si vas a hacer varias peticiones, una `requests.Session()` guarda las cabeceras y las envía en todas:

```py
import requests

sesion = requests.Session()
sesion.headers["X-API-Key"] = "demo-clima-2026"

for ciudad in ["Pasto", "Santa Marta"]:
    datos = sesion.get("https://api.clima.example/v1/actual", params={"ciudad": ciudad}).json()
    print(datos["ciudad"], datos["temperatura"], "°C")
```

### Guarda bien tus claves

Una clave es como una contraseña: quien la tenga puede usar el servicio en tu nombre. En tus propios proyectos, no la escribas en el código que compartes (por ejemplo, en GitHub): guárdala en una **variable de entorno** y léela con `os.environ["CLIMA_API_KEY"]`. En el simulador usamos una clave de prueba, así que no pasa nada por escribirla.

### Cuántas peticiones te quedan

Las APIs con clave suelen limitar las peticiones. Esta permite 5 cada 10 segundos por clave, y en cada respuesta te dice cuántas te quedan en la cabecera `X-RateLimit-Remaining`. Las cabeceras de la respuesta están en `respuesta.headers`, un diccionario que no distingue mayúsculas de minúsculas.

## Ejercicio

Usa la clave `demo-clima-2026` con una **sesión** (`requests.Session()`) para pedir a la API del clima:

1. La lista de ciudades (`/v1/ciudades`), y muestra cuántas hay.
2. El tiempo actual (`/v1/actual`) de Bogotá, Cartagena y Leticia, en ese orden, con su temperatura y su estado.
3. Cuántas peticiones te quedan según la cabecera `X-RateLimit-Remaining` de la última respuesta.

```txt
Ciudades con datos: 12
Bogotá: 15 °C, Lluvioso
Cartagena: 29 °C, Soleado
Leticia: 28 °C, Tormentas
Peticiones restantes: 1
```

## Pista

Después de crear la sesión, guarda la clave con sesion.headers["X-API-Key"] = CLAVE y haz todas las peticiones con sesion.get(...). La última respuesta tiene la cabecera en respuesta.headers["X-RateLimit-Remaining"].
