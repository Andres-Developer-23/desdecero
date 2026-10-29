---
title: Errores, límites y reintentos
minutes: 18
summary: Qué significa cada código de error y cómo reintentar cuando la API está ocupada o pide esperar.
web: https://api.clima.example/
---

Al trabajar con APIs, los errores no son raros: forman parte de la conversación. Lo importante es saber qué significa cada uno y qué hacer.

### Los códigos de estado

El primer número del código dice de quién es el problema:

- **2xx, todo bien**: `200 OK`, `201 Created` (se creó algo), `204 No Content` (bien, pero sin datos que devolver).
- **4xx, la petición tiene un problema**: `400` parámetros incorrectos, `401` falta la clave, `403` sin permiso, `404` no existe, `405` método no permitido, `422` datos no válidos y `429` demasiadas peticiones. Repetir la misma petición dará el mismo error (salvo el 429): hay que corregirla.
- **5xx, el servidor tiene un problema**: `500` error interno, `503` servicio no disponible. No es culpa tuya, y suele arreglarse solo: se puede **reintentar** un poco después.

### raise_for_status()

`respuesta.raise_for_status()` lanza `requests.HTTPError` si el código es 4xx o 5xx, y no hace nada si todo fue bien. Así el programa no sigue con datos que no son lo que espera. La respuesta va dentro del error:

```py
import requests

try:
    respuesta = requests.get("https://api.clima.example/v1/ciudades")
    respuesta.raise_for_status()
except requests.HTTPError as error:
    print("Falló:", error)
    print("La API dice:", error.response.json()["error"])
```

### 429: demasiadas peticiones

La API del clima permite 5 peticiones cada 10 segundos. Si te pasas, responde **429 Too Many Requests** y, en la cabecera `Retry-After`, cuántos segundos esperar. Lo correcto es hacer caso: esperar con `time.sleep()` y volver a intentarlo.

```py
import requests
import time

sesion = requests.Session()
sesion.headers["X-API-Key"] = "demo-clima-2026"

for numero in range(1, 8):
    respuesta = sesion.get("https://api.clima.example/v1/actual", params={"ciudad": "Cali"})
    print(numero, respuesta.status_code, respuesta.headers.get("Retry-After"))
    if respuesta.status_code == 429:
        time.sleep(int(respuesta.headers["Retry-After"]))
```

En el simulador, `time.sleep()` no espera de verdad: avanza un reloj simulado. En la pestaña **web** verás en qué segundo empezó cada petición.

### 503: reintentar con paciencia

El servicio de alertas del clima está saturado: las dos primeras peticiones de cada programa reciben **503 Service Unavailable**. Para estos errores temporales se reintenta unas pocas veces, esperando un poco más cada vez:

```py
import requests
import time

sesion = requests.Session()
sesion.headers["X-API-Key"] = "demo-clima-2026"

espera = 1
for intento in range(1, 5):
    respuesta = sesion.get("https://api.clima.example/v1/alertas", params={"ciudad": "Leticia"}, timeout=5)
    print("Intento", intento, "→", respuesta.status_code)
    if respuesta.status_code != 503:
        break
    time.sleep(espera)
    espera *= 2

respuesta.raise_for_status()
print(respuesta.json()["alertas"])
```

Esperar el doble cada vez (1, 2, 4... segundos) se llama **espera exponencial** (*exponential backoff*): da tiempo al servidor a recuperarse sin bombardearlo. Y siempre con un **límite de intentos**: si el servicio está caído de verdad, el programa tiene que rendirse en algún momento.

### timeout=

`timeout=5` hace que requests se rinda si el servidor tarda más de 5 segundos en responder, y lance `requests.Timeout`. Sin él, un programa puede quedarse esperando para siempre. En tus programas reales, pon siempre un `timeout`.

## Ejercicio

Escribe la función `pedir(sesion, ruta, params)`, que pida `BASE + ruta` con esos parámetros y `timeout=5`, y:

- si la respuesta es **429** o **503**, espere los segundos de la cabecera `Retry-After` (o 1 si no viene), sume 1 a la variable global `reintentos` y vuelva a intentarlo, hasta **5 intentos** en total;
- con cualquier otra respuesta, llame a `raise_for_status()` y devuelva `respuesta.json()`.

Después úsala para mostrar las alertas de Leticia (el servicio de alertas falla dos veces) y la temperatura actual de las seis ciudades de `CIUDADES` (te pasarás del límite de peticiones). Al final, muestra los reintentos:

```txt
Alertas en Leticia: Tormentas eléctricas fuertes por la tarde.
Bogotá: 15 °C
...
Pasto: 14 °C
Reintentos: 5
```

## Pista

Dentro de pedir(), usa for intento in range(5): haz la petición; si respuesta.status_code in (429, 503), espera int(respuesta.headers.get("Retry-After", 1)) segundos, suma el reintento (con global reintentos) y continue. Si no, raise_for_status() y return respuesta.json(). Las alertas están en datos["alertas"], una lista de diccionarios con "mensaje".
