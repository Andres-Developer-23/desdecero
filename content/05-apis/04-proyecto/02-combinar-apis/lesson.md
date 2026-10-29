---
title: Combinar varias APIs
minutes: 16
summary: Usa los datos de una API como entrada de otra, con las peticiones justas.
web: https://api.cambio.example/
---

Los programas útiles suelen **combinar** varias fuentes: los precios de una tienda con el cambio de moneda del día, una lista de ciudades con su pronóstico, un catálogo con las reseñas de otro servicio.

En esta lección usarás dos APIs a la vez: la de la librería, con precios en pesos colombianos (`COP`), y la de cambio de moneda, [api.cambio.example](https://api.cambio.example/):

```py
import requests

URL = "https://api.cambio.example/v1"
print(requests.get(URL + "/monedas").json())
print(requests.get(URL + "/convertir", params={"de": "USD", "a": "COP", "cantidad": 10}).json())
```

### Cuántas peticiones hacer

Imagina que quieres los precios de 18 libros en dólares. Podrías llamar a `/v1/convertir` una vez por libro: 18 peticiones. Pero también puedes pedir **una sola vez** todas las tasas con `/v1/tasas` y hacer las cuentas en tu programa:

```py
import requests

tasas = requests.get("https://api.cambio.example/v1/tasas", params={"base": "COP"}).json()
print("Fecha:", tasas["fecha"])
print("1 COP en USD:", tasas["tasas"]["USD"])
print("68500 COP en USD:", round(68500 * tasas["tasas"]["USD"], 2))
```

Menos peticiones significa un programa más rápido, menos riesgo de llegar al límite de la API y menos carga para el servidor. Antes de hacer una petición dentro de un bucle, pregúntate si puedes traer todo de una vez o **reutilizar** un dato que ya pediste.

### Una función por API

Para que el programa no se convierta en una maraña, pon cada API detrás de una función pequeña que devuelva datos de Python. El resto del programa no necesita saber de URLs ni de parámetros:

```py
import requests


def libros_de(categoria):
    datos = requests.get("https://api.libreria.example/v1/libros", params={"categoria": categoria, "por_pagina": 10}).json()
    return datos["resultados"]


def tasas_desde(moneda):
    return requests.get("https://api.cambio.example/v1/tasas", params={"base": moneda}).json()["tasas"]


usd = tasas_desde("COP")["USD"]
for libro in libros_de("Poesía"):
    print(libro["titulo"], f"{libro['precio'] * usd:.2f} USD")
```

`f"{valor:.2f}"` muestra siempre dos decimales, como se hace con el dinero.

## Ejercicio

Prepara un presupuesto en dólares y euros de los libros de **Programación**:

1. Pide a la librería los libros de esa categoría (`por_pagina=10`).
2. Pide **una sola vez** las tasas con base `COP` a la API de cambio.
3. Muestra cada libro con su precio en `COP`, `USD` y `EUR`, y al final el total. Los dólares y los euros, con 2 decimales (`:.2f`), calculados como `precio * tasa`.

```txt
Python para curiosos: 68500 COP = 16.37 USD = 15.08 EUR
...
Total: 205500 COP = 49.10 USD = 45.24 EUR
```

En total, tu programa tiene que hacer **2 peticiones**.

## Pista

Guarda tasas = requests.get(..., params={"base": "COP"}).json()["tasas"] antes del bucle, y usa tasas["USD"] y tasas["EUR"] dentro. Ve sumando los precios en pesos en una variable total y, al final, convierte el total con las mismas tasas.
