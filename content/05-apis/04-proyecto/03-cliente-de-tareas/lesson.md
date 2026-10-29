---
title: "Proyecto: un cliente completo"
minutes: 20
summary: "Reúne todo en una clase ClienteTareas: sesión, token, métodos HTTP y errores propios."
web: https://api.tareas.example/
---

En los programas reales, el código que habla con una API se agrupa en una clase: un **cliente**. El resto del programa llama a métodos con nombres claros (`crear`, `completar`) y no se preocupa de URLs, cabeceras ni códigos de estado.

### La estructura de un cliente

- `__init__` crea la `requests.Session()` que guardará el token.
- Un método **central**, `_pedir()`, hace todas las peticiones: añade la URL base y el `timeout`, comprueba la respuesta y convierte los errores de la API en una **excepción propia** con el mensaje que da la API. Así, cada error se trata en un solo sitio.
- Un método por cada acción, cortos, que llaman a `_pedir()`.

```py
import requests


class ErrorDeApi(Exception):
    """La API respondió con un error. Guarda el código y el mensaje."""

    def __init__(self, estado, mensaje):
        super().__init__(f"Error {estado}: {mensaje}")
        self.estado = estado


class ClienteLibreria:
    BASE = "https://api.libreria.example/v1"

    def __init__(self):
        self.sesion = requests.Session()

    def _pedir(self, metodo, ruta, **opciones):
        respuesta = self.sesion.request(metodo, self.BASE + ruta, timeout=5, **opciones)
        if not respuesta.ok:
            raise ErrorDeApi(respuesta.status_code, respuesta.json()["error"])
        return respuesta.json()

    def libro(self, id_libro):
        return self._pedir("GET", f"/libros/{id_libro}")

    def buscar(self, texto):
        return self._pedir("GET", "/libros", params={"q": texto})["resultados"]


cliente = ClienteLibreria()
print(cliente.libro(13)["titulo"])
print([libro["titulo"] for libro in cliente.buscar("dragón")])

try:
    cliente.libro(404)
except ErrorDeApi as error:
    print(error, "·", error.estado)
```

`sesion.request(metodo, url, ...)` hace una petición con el método que le digas: es lo que usan por dentro `get()`, `post()` y los demás. `**opciones` recoge los argumentos con nombre (`params=`, `json=`...) y los pasa tal cual.

### Respuestas sin cuerpo

Recuerda que un `DELETE` responde `204` sin cuerpo: el método central tiene que devolver `None` en ese caso en lugar de llamar a `.json()`.

Con esto tienes todo lo necesario para el proyecto final: un cliente completo de la API de tareas.

## Ejercicio

Completa la clase `ClienteTareas`:

- `_pedir(metodo, ruta, **opciones)`: hace la petición a `BASE + ruta` con `timeout=5`. Si la respuesta no es correcta, lanza `ErrorDeApi(estado, mensaje)` con el `"error"` del JSON. Si es `204`, devuelve `None`; si no, el JSON.
- `iniciar_sesion(usuario, clave)`: consigue el token y lo guarda en la cabecera `Authorization` de la sesión.
- `pendientes()`: la lista de tareas sin hacer (la API admite el parámetro `hecha=false`).
- `crear(titulo, prioridad="media")`, `completar(id_tarea)` y `borrar(id_tarea)`.

El programa principal ya está escrito y no hay que cambiarlo. Su salida debe ser:

```txt
Sesión iniciada como ana
Creada: 6 Repasar los métodos HTTP
Creada: 7 Escribir el informe
Completada: 6
Borrada: 1
Error 404: No tienes ninguna tarea con id 99
Pendientes:
- 2 Terminar el curso de Python (alta)
- 7 Escribir el informe (media)
```

## Pista

En _pedir: respuesta = self.sesion.request(metodo, self.BASE + ruta, timeout=5, **opciones); si not respuesta.ok, raise ErrorDeApi(respuesta.status_code, respuesta.json()["error"]); si respuesta.status_code == 204, return None. completar() es self._pedir("PATCH", f"/tareas/{id_tarea}", json={"hecha": True}) y pendientes() usa params={"hecha": "false"}.
