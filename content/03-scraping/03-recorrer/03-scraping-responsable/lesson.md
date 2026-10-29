---
title: Scraping responsable
minutes: 25
summary: robots.txt, identificarse con User-Agent, hacer pausas y tratar los errores.
web: https://noticias.example/robots.txt
---

Un scraper puede hacer cientos de peticiones en un minuto, y detrás de cada sitio hay un servidor que alguien paga y personas que publicaron sus datos. Hacer scraping de forma responsable no es opcional:

- **Lee las condiciones de uso** del sitio. Algunos prohíben el scraping o piden usar su API, una forma oficial de pedir los datos.
- **Cuidado con los datos personales.** Nombres, correos o fotos de personas están protegidos por leyes de protección de datos (en Colombia, la Ley 1581 de 2012; en Europa, el RGPD). Que algo sea visible en una web no significa que puedas recopilarlo y usarlo para lo que quieras. Esto no es asesoramiento legal: ante la duda, pregunta.
- **No sobrecargues el servidor**: pocas peticiones, con pausas, y solo las páginas que necesitas.
- **Identifícate** y **respeta robots.txt**.

### robots.txt

Casi todos los sitios publican en su raíz un archivo `robots.txt` con las normas para los programas que los recorren. Ábrelo en la pestaña **web**: el de la gaceta prohíbe la carpeta `/borradores/` a todos (`User-agent: *`) y prohíbe el sitio entero a un robot llamado `CopiadorRapido`. Python trae un lector para estos archivos:

```py
from urllib.robotparser import RobotFileParser

robots = RobotFileParser("https://noticias.example/robots.txt")
robots.read()
print(robots.can_fetch("BotDelCurso", "https://noticias.example/"))
print(robots.can_fetch("BotDelCurso", "https://noticias.example/borradores/"))
print(robots.can_fetch("CopiadorRapido", "https://noticias.example/"))
```

`can_fetch(robot, url)` responde si ese robot puede visitar esa dirección. Algunos sitios piden además una pausa entre peticiones con `Crawl-delay`, que se lee con `robots.crawl_delay(robot)`.

### Identificarse y hacer pausas

Con cada petición viajan unas **cabeceras**. `User-Agent` dice quién la hace: por defecto, requests se presenta como `python-requests/2.32.3`. Lo correcto es poner un nombre para tu robot y una forma de contacto, con el parámetro `headers`:

```py
import time
import requests

CABECERAS = {"User-Agent": "BotDelCurso/1.0 (aprendiendo scraping; tu@correo.example)"}

for url in ["https://noticias.example/", "https://noticias.example/robots.txt"]:
    respuesta = requests.get(url, headers=CABECERAS, timeout=10)
    print(respuesta.status_code, url)
    time.sleep(1)
```

- `time.sleep(1)` detiene el programa un segundo entre petición y petición. En el simulador no espera de verdad, pero la pestaña **web** enseña la hora de cada petición y se nota la pausa.
- `timeout=10` hace que requests deje de esperar si el servidor tarda más de 10 segundos en contestar. Sin él, un servidor colgado podría dejar tu programa esperando para siempre.

### Errores

Las cosas fallan: páginas que ya no existen, servidores caídos, conexiones lentas. Un buen scraper lo tiene en cuenta en lugar de romperse a la mitad:

```py
import requests

for url in ["https://noticias.example/", "https://noticias.example/no-existe.html", "https://otra-web.com/"]:
    try:
        respuesta = requests.get(url, timeout=10)
        respuesta.raise_for_status()
        print("OK", url)
    except requests.exceptions.HTTPError as error:
        print("Error HTTP:", error)
    except requests.exceptions.RequestException as error:
        print("No se pudo conectar:", url)
```

`raise_for_status()` lanza `HTTPError` si el código es de error (400 o más). `RequestException` es la madre de todos los errores de requests: si la pones al final, captura cualquier otro problema. También puedes comprobar `respuesta.status_code` con un `if`, sin excepciones.

## Ejercicio

Escribe un scraper responsable que visite, en orden, las direcciones de la lista `URLS`:

1. Lee el `robots.txt` de `https://noticias.example/` con `RobotFileParser`.
2. Si `robots.txt` no deja que el robot `BotDelCurso` visite una dirección, **no la pidas** y muestra `Prohibida: <url>`.
3. Si puede visitarla, pídela con la cabecera `User-Agent` de `CABECERAS` y `timeout=10`. Si el código es 200, muestra el texto de su `<h1>`; si no, muestra `Error <código>: <url>`.
4. Después de cada petición a una página, espera 1 segundo con `time.sleep(1)`.

```txt
La biblioteca municipal abrirá también de noche
Prohibida: https://noticias.example/borradores/proxima-portada.html
Error 404: https://noticias.example/2026/10/20/esta-noticia-no-existe.html
...
```

## Pista

Primero robots = RobotFileParser("https://noticias.example/robots.txt") y robots.read(). En el bucle, usa robots.can_fetch("BotDelCurso", url) y, si se puede, requests.get(url, headers=CABECERAS, timeout=10). El time.sleep(1) va dentro de la rama que hace la petición.
