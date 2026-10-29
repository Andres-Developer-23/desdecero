---
title: "Modificar y borrar: PUT, PATCH y DELETE"
minutes: 15
summary: Cambia datos con PUT y PATCH, bórralos con DELETE y entiende la respuesta 204 sin cuerpo.
web: https://api.tareas.example/
---

Para cambiar o borrar algo hay que decirle a la API **qué**: la ruta del recurso lleva su id, como `/v1/tareas/2`.

### PATCH: cambiar solo una parte

`PATCH` envía solo los campos que cambian; el resto se queda como estaba. Es lo más habitual para, por ejemplo, marcar una tarea como hecha:

```py
import requests

sesion = requests.Session()
sesion.headers["Authorization"] = "Bearer tk-ana-5f2b9c"

respuesta = sesion.patch("https://api.tareas.example/v1/tareas/2", json={"hecha": True})
print(respuesta.status_code)
print(respuesta.json())
```

### PUT: reemplazar entero

`PUT` reemplaza el recurso **completo** por lo que envías. Los campos que no incluyas vuelven a su valor por defecto. Compara el resultado de los dos métodos:

```py
import requests

sesion = requests.Session()
sesion.headers["Authorization"] = "Bearer tk-ana-5f2b9c"
URL = "https://api.tareas.example/v1/tareas/2"

print("Antes:", sesion.get(URL).json())
print("PATCH:", sesion.patch(URL, json={"titulo": "Terminar la ruta de APIs"}).json())
print("PUT:  ", sesion.put(URL, json={"titulo": "Terminar la ruta de APIs"}).json())
```

Con `PUT` la prioridad pasó de `alta` a `media`, el valor por defecto, porque no la enviaste. Por eso, con `PUT` hay que mandar todos los campos que quieras conservar.

### DELETE: borrar

`DELETE` no lleva datos: basta con la ruta. Si lo borra, la API responde **204 No Content**, que significa «hecho, y no tengo nada que devolverte». El cuerpo está vacío, así que `respuesta.json()` fallaría: comprueba el código.

```py
import requests

sesion = requests.Session()
sesion.headers["Authorization"] = "Bearer tk-ana-5f2b9c"

respuesta = sesion.delete("https://api.tareas.example/v1/tareas/3")
print(respuesta.status_code, respuesta.reason, repr(respuesta.text))

otra_vez = sesion.delete("https://api.tareas.example/v1/tareas/3")
print(otra_vez.status_code, otra_vez.json())
```

Borrar dos veces lo mismo da `404` la segunda vez: ya no existe. Lo mismo pasa si intentas tocar una tarea de otro usuario: para ti, no existe.

### Métodos que se pueden repetir

`GET`, `PUT` y `DELETE` dejan los datos igual aunque repitas la petición: se dice que son **idempotentes**. `POST` no: cada vez crea algo nuevo. Por eso, si una petición `POST` falla por un problema de red, hay que tener cuidado al reintentarla, no vaya a crearse dos veces.

## Ejercicio

Con el token de `TOKEN`, ordena las tareas de ana:

1. Marca como hechas (con `PATCH`) las tareas **pendientes** de prioridad **alta**, y muestra `Completada: <titulo>`.
2. Cambia el título de la tarea **1** a `Comprar pan integral` con `PUT`, conservando su prioridad (`baja`), y muestra `Renombrada: <titulo> (<prioridad>)`.
3. Borra (con `DELETE`) todas las tareas **hechas**, y muestra `Borrada: <id>` si la API responde 204.
4. Muestra las tareas que quedan, como en la lección anterior.

```txt
Completada: Terminar el curso de Python
Renombrada: Comprar pan integral (baja)
Borrada: 2
Borrada: 3
Tareas que quedan:
[ ] 1 Comprar pan integral (baja)
```

Saca de la API qué tareas están pendientes o hechas: no escribas sus ids.

## Pista

Pide la lista con sesion.get(BASE + "/tareas").json() antes de cada paso y filtra con if. La URL de cada tarea es f"{BASE}/tareas/{tarea['id']}". Para el PUT, envía json={"titulo": "Comprar pan integral", "prioridad": "baja"}. Después de un DELETE, comprueba respuesta.status_code == 204.
