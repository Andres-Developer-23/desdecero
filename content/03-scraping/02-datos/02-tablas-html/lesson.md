---
title: Tablas HTML
minutes: 20
summary: Recorrer filas y celdas de una tabla y convertirla en una lista de diccionarios.
web: https://clima.example/
---

Las **tablas** son una mina de datos: horarios, resultados, precios, estadísticas. Su HTML siempre tiene la misma forma:

```html
<table>
  <thead>
    <tr><th>Ciudad</th><th>Máxima</th></tr>
  </thead>
  <tbody>
    <tr><th>Bogotá</th><td>19 °C</td></tr>
    <tr><th>Cali</th><td>30 °C</td></tr>
  </tbody>
</table>
```

- `<table>` es la tabla; `<thead>` la cabecera y `<tbody>` el cuerpo.
- Cada `<tr>` es una **fila** (*table row*).
- Dentro, cada celda es un `<td>` (dato) o un `<th>` (encabezado). A veces la primera celda de cada fila también es un `<th>`, como en la tabla del clima.

Para leerla se recorren las filas y, dentro de cada una, sus celdas. `find_all` acepta una lista de nombres, así que `fila.find_all(["th", "td"])` da todas las celdas en orden:

```py
import requests
from bs4 import BeautifulSoup

sopa = BeautifulSoup(requests.get("https://clima.example/").text, "html.parser")
tabla = sopa.find("table", id="pronostico")

encabezados = [th.get_text(strip=True) for th in tabla.thead.find_all("th")]
print(encabezados)

for fila in tabla.tbody.find_all("tr")[:3]:
    celdas = [celda.get_text(strip=True) for celda in fila.find_all(["th", "td"])]
    print(celdas)
```

Con los encabezados y las celdas, `zip()` empareja cada encabezado con su valor y `dict()` forma el diccionario:

```py
encabezados = ["Ciudad", "Máxima", "Lluvia"]
celdas = ["Bogotá", "19 °C", "70 %"]
print(dict(zip(encabezados, celdas)))
```

Así cada fila se convierte en un diccionario, y la tabla entera en una lista de diccionarios: el formato con el que trabajarás el resto de la ruta. Recuerda limpiar los números (`"19 °C"` → `19`) antes de compararlos.

## Ejercicio

Lee la tabla de `https://clima.example/` y guarda en una lista llamada `ciudades` un diccionario por fila con las claves `"ciudad"`, `"maxima"`, `"minima"` y `"lluvia"`. Las tres últimas, como números enteros (`"19 °C"` → `19`, `"70 %"` → `70`).

Después muestra:

```txt
Más calurosa: Santa Marta (34 °C)
Más fría: Bogotá (8 °C)
Lluvia de 70 % o más: Bogotá, Pereira, Manizales, Leticia
```

La más calurosa es la de mayor máxima y la más fría la de menor mínima (si hay empate, la primera). La última línea lleva las ciudades en el orden de la tabla.

## Pista

Recorre tabla.tbody.find_all("tr") y saca las celdas con fila.find_all(["th", "td"]): la ciudad es celdas[0], la máxima celdas[1]... Para la última línea, junta los nombres con ", ".join(lista).
