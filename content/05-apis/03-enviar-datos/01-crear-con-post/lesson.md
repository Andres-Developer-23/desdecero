---
title: Crear datos con POST
minutes: 16
summary: Inicia sesión para conseguir un token y crea datos enviando JSON con requests.post().
web: https://api.tareas.example/
---

Hasta ahora solo has **leído** datos con `GET`. Pero las APIs también permiten **crearlos, cambiarlos y borrarlos**. Cada acción tiene su **método HTTP**:

- `GET`: leer;
- `POST`: crear algo nuevo;
- `PUT`: reemplazar algo entero;
- `PATCH`: cambiar una parte;
- `DELETE`: borrar.

Son las cuatro operaciones básicas con datos, que se conocen como **CRUD** (*create, read, update, delete*). En esta lección y la siguiente las usarás con la API de tareas del curso: [api.tareas.example](https://api.tareas.example/).

### Enviar datos en JSON

Con `requests.post()`, los datos se envían en el **cuerpo** de la petición. Pásalos con `json=` y requests los convierte a JSON y añade la cabecera `Content-Type: application/json`, que avisa al servidor del formato:

```py
import requests

respuesta = requests.post(
    "https://api.tareas.example/v1/token",
    json={"usuario": "ana", "clave": "python123"},
)
print(respuesta.status_code)
print(respuesta.json())
```

Esta ruta es el **inicio de sesión**: con un usuario y su clave, la API devuelve un **token**, una llave temporal para hacer el resto de peticiones sin enviar la contraseña cada vez.

No confundas `json=` con `data=`: `data=` envía los datos como un formulario web (`titulo=Leer&prioridad=alta`). Esta API solo entiende JSON, y responde `415 Unsupported Media Type` si le llega otra cosa.

### El token en Authorization

El token se envía en la cabecera `Authorization`, con la palabra `Bearer` delante (en inglés, «portador»: quien lleva el token tiene acceso). Sin él, la API responde `401`:

```py
import requests

URL = "https://api.tareas.example/v1/tareas"
print(requests.get(URL).status_code)

token = requests.post("https://api.tareas.example/v1/token", json={"usuario": "ana", "clave": "python123"}).json()["token"]
tareas = requests.get(URL, headers={"Authorization": f"Bearer {token}"}).json()
for tarea in tareas:
    print(tarea)
```

### Crear: 201 Created

Al crear algo con éxito, la API responde **201 Created**, devuelve el recurso creado con el `id` que le asignó y su dirección en la cabecera `Location`:

```py
import requests

sesion = requests.Session()
token = sesion.post("https://api.tareas.example/v1/token", json={"usuario": "ana", "clave": "python123"}).json()["token"]
sesion.headers["Authorization"] = f"Bearer {token}"

respuesta = sesion.post("https://api.tareas.example/v1/tareas", json={"titulo": "Aprender POST", "prioridad": "alta"})
print(respuesta.status_code, respuesta.reason)
print(respuesta.headers["Location"])
print(respuesta.json())
```

Los campos que no envías toman su valor por defecto: la tarea empieza sin hacer (`"hecha": false`).

### 422: datos no válidos

Antes de guardar nada, la API **valida** los datos. Si algo falla, responde **422** y explica cada problema en `detalles`:

```py
import requests

sesion = requests.Session()
sesion.headers["Authorization"] = "Bearer tk-ana-5f2b9c"

respuesta = sesion.post("https://api.tareas.example/v1/tareas", json={"title": "Leer", "prioridad": "urgente"})
print(respuesta.status_code)
print(respuesta.json()["detalles"])
```

En el simulador, cada programa empieza con las mismas tareas: lo que crees desaparece al volver a ejecutar.

## Ejercicio

Inicia sesión en la API de tareas como `ana` (clave `python123`) para conseguir el token, y úsalo para crear las tareas de la lista `nuevas`, en orden.

- Si la API crea la tarea (**201**), muestra `Creada la tarea <id>: <titulo>`.
- Si responde **422**, muestra `No se pudo crear: <campo> <problema>` con cada problema de `detalles`.

Por último, pide todas tus tareas y muéstralas con `[x]` si están hechas y `[ ]` si no, su id, su título y su prioridad:

```txt
Creada la tarea 6: Preparar la presentación
Creada la tarea 7: Comprar café
No se pudo crear: titulo no puede estar vacío
Tus tareas:
[ ] 1 Comprar pan (baja)
...
[ ] 7 Comprar café (media)
```

No escribas el token a mano: sácalo de la respuesta del inicio de sesión.

## Pista

token = sesion.post(BASE + "/token", json={"usuario": "ana", "clave": "python123"}).json()["token"] y después sesion.headers["Authorization"] = f"Bearer {token}". Para los errores, recorre respuesta.json()["detalles"].items(). La marca puede ser "[x]" if tarea["hecha"] else "[ ]".
