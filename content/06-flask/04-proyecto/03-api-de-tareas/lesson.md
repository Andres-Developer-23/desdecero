---
title: "Proyecto: tu propia API de tareas"
minutes: 25
summary: "Construye una API de tareas completa: token, validación con 422, CRUD, filtros y errores en JSON."
web: http://127.0.0.1:5000/v1/tareas
---

En la ruta de APIs usaste `api.tareas.example`, una API de tareas con token, validación y todas las operaciones. Ahora vas a construir **tu propia versión** con todo lo que has aprendido:

- rutas con variables y parámetros de consulta;
- respuestas JSON con el código adecuado (`200`, `201`, `204`, `401`, `404`, `422`);
- datos con `POST` y `PATCH`, validados antes de guardarlos;
- un decorador que exige el token;
- errores en JSON con `@app.errorhandler`.

### La especificación

Una API se diseña antes de programarla: qué rutas tiene, qué recibe y qué responde. Esta es la tuya:

- `POST /v1/token` con `{"usuario", "clave"}`: `{"token", "tipo": "Bearer"}`, o `401`.
- `GET /v1/tareas`: las tareas del usuario. Con `?hecha=true` o `?hecha=false`, solo las hechas o las pendientes.
- `POST /v1/tareas`: crea una tarea. Responde `201` con la tarea y la cabecera `Location`.
- `GET /v1/tareas/<id>`: una tarea.
- `PATCH /v1/tareas/<id>`: cambia los campos que lleguen.
- `DELETE /v1/tareas/<id>`: la borra (`204`).

Las rutas de tareas exigen el token. Una tarea de otro usuario, para ti, no existe (`404`). Los campos de una tarea son:

- `titulo`: un texto no vacío de 80 caracteres como mucho (obligatorio al crear);
- `hecha`: `true` o `false` (`false` si no se indica);
- `prioridad`: `baja`, `media` o `alta` (`media` si no se indica).

Si los datos no son válidos, la respuesta es `422` con los problemas de cada campo, igual que hacía la API de práctica:

```txt
{"error": "Los datos no son válidos", "detalles": {"titulo": "no puede estar vacío"}}
```

### Antes de empezar

El punto de partida ya tiene los datos, el inicio de sesión, el decorador `requiere_token`, el manejador de errores y algunas funciones de ayuda (`publica`, `buscar`, `datos_json`), además de ver una tarea. Léelo con calma antes de escribir: entender código ajeno es la mitad del trabajo en un proyecto real.

Cuando lo termines, pruébalo en la pestaña **web**: inicia sesión con `POST /v1/token` y escribe el token en las cabeceras (`Authorization: Bearer tk-ana-5f2b9c`) para el resto de las peticiones.

## Ejercicio

Completa la API de tareas:

1. `validar(datos, parcial)`: devuelve un diccionario con los problemas. `"campo desconocido"` para cualquier campo que no sea `titulo`, `hecha` o `prioridad`; para `titulo`, `"es obligatorio"` si falta y no es parcial, `"no puede estar vacío"` si no es un texto con algo escrito y `"admite como máximo 80 caracteres"` si es más largo; para `hecha`, `"debe ser true o false"`; para `prioridad`, `"debe ser baja, media o alta"`.
2. `GET /v1/tareas`: añade el filtro `hecha` (`true` o `false`).
3. `POST /v1/tareas`: valida (si hay problemas, `422` con `{"error": "Los datos no son válidos", "detalles": ...}`), crea la tarea con id el mayor más uno, el título sin espacios en los extremos y los valores por defecto, y responde `201` con `publica(tarea)` y `Location` (con `url_for`).
4. `PATCH /v1/tareas/<id>`: valida con `parcial=True` y cambia solo los campos que lleguen.
5. `DELETE /v1/tareas/<id>`: la borra y responde `204`.

## Pista

Usa datos_json() para leer el cuerpo y buscar(usuario, id) para encontrar la tarea (ya responden 400 y 404). En validar(), recorre primero los campos de datos para los desconocidos y después comprueba cada uno de los tres. Para el filtro: hecha = request.args.get("hecha"); if hecha in ("true", "false"): tareas = [t for t in tareas if t["hecha"] == (hecha == "true")].
