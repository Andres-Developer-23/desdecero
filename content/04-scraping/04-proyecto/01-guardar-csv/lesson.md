---
title: Guardar los datos en un CSV
minutes: 20
summary: Escribir y leer archivos CSV con el módulo csv para usar los datos en una hoja de cálculo.
web: https://clima.example/
---

Un scraper que solo imprime en pantalla pierde su trabajo al terminar. Lo normal es **guardar** lo que extrae en un archivo, y el formato más práctico para datos en forma de tabla es el **CSV** (*comma-separated values*): texto plano, una fila por línea y los valores separados por comas. Se abre con Excel, Google Sheets, LibreOffice o con pandas.

```txt
ciudad,maxima,minima
Bogotá,19,8
Medellín,27,17
```

Python trae el módulo `csv`. Con `csv.writer` se escriben filas como listas:

```py
import csv

with open("ciudades.csv", "w", newline="", encoding="utf-8") as archivo:
    escritor = csv.writer(archivo)
    escritor.writerow(["ciudad", "maxima"])
    escritor.writerow(["Bogotá", 19])
    escritor.writerow(["Medellín", 27])
```

- `open(nombre, "w", ...)` crea el archivo (o lo vacía si ya existía). `with` lo cierra solo al terminar el bloque.
- `newline=""` evita líneas en blanco de más en Windows, y `encoding="utf-8"` guarda bien las tildes y la ñ. Ponlos siempre con `csv`.
- Si un valor contiene una coma, `csv` lo pone entre comillas para que no se confunda con el separador.

Como tus datos ya son diccionarios, es más cómodo `csv.DictWriter`, que escribe cada diccionario como una fila con las columnas de `fieldnames`:

```py
import csv

libros = [
    {"titulo": "El faro de la niebla", "precio": 45900},
    {"titulo": "Datos limpios, mentes tranquilas", "precio": 74000},
]
with open("libros.csv", "w", newline="", encoding="utf-8") as archivo:
    escritor = csv.DictWriter(archivo, fieldnames=["titulo", "precio"])
    escritor.writeheader()
    escritor.writerows(libros)

with open("libros.csv", newline="", encoding="utf-8") as archivo:
    for fila in csv.DictReader(archivo):
        print(fila["titulo"], fila["precio"])
```

`writeheader()` escribe la fila de encabezados y `writerows()` todas las filas de una vez. Para leer, `csv.DictReader` devuelve cada fila como un diccionario. Ojo: al leer, todos los valores son **texto** (`"45900"`), aunque los guardaras como números.

Al ejecutar, la consola te enseña los archivos que guardó tu programa. En el simulador, cada ejecución empieza con la carpeta vacía; en tu ordenador, el archivo queda en la carpeta desde la que ejecutas el programa. Si Excel muestra mal las tildes al abrirlo, guarda con `encoding="utf-8-sig"`.

## Ejercicio

Lee la tabla de `https://clima.example/` y guárdala en `clima.csv` con estas columnas, en este orden: `ciudad`, `maxima`, `minima`, `lluvia` y `cielo`. Las temperaturas y la lluvia, sin unidades (`19`, no `19 °C`).

Después, vuelve a abrir `clima.csv`, cuenta sus filas con `csv.DictReader` y muestra:

```txt
Guardadas 12 ciudades en clima.csv
```

## Pista

Arma una lista de diccionarios como en la lección de tablas, añadiendo "cielo". Escríbela con csv.DictWriter(archivo, fieldnames=[...]), writeheader() y writerows(). Para contar, len(list(csv.DictReader(archivo))).
