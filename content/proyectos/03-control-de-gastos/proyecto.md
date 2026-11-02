---
title: Control de gastos
level: principiante
tags: [Menús, Archivos, CSV]
minutes: 75
runtime: python
requires: python
file: gastos.py
summary: "Un programa con menú para apuntar tus gastos, verlos, borrarlos y resumirlos por categoría y por mes, guardados en un CSV."
---

¿En qué se te va el dinero? Vas a construir un **control de gastos** que funciona con un menú en la terminal: apuntas cada gasto con su fecha, su descripción, su categoría y su importe, y el programa te los enseña en una tabla y te hace un resumen por categorías, de todo o de un mes. Los gastos se guardan en un archivo **CSV**, que puedes abrir también con una hoja de cálculo.

El reto de este proyecto es **validar los datos**: quien usa el programa puede escribir una fecha imposible, un importe negativo o una opción que no existe, y el programa tiene que explicarlo y volver a preguntar, nunca romperse.

### Requisitos

El programa enseña este menú una y otra vez hasta que eliges salir:

```txt
=== Control de gastos ===
1. Añadir un gasto
2. Ver los gastos
3. Resumen
4. Borrar un gasto
5. Salir
Elige una opción:
```

- **Añadir** pide la fecha (`AAAA-MM-DD`), la descripción, la categoría y el importe. La fecha tiene que existir (no vale `2026-02-30`), la descripción y la categoría no pueden quedar vacías y el importe tiene que ser un número mayor que 0, escrito con punto o con coma decimal. Si un dato no vale, lo explica y vuelve a preguntar ese dato. Las categorías se guardan en minúsculas.
- **Ver** enseña una tabla con todos los gastos, ordenados por fecha.
- **Resumen** pregunta un mes (`AAAA-MM`, o nada para todos) y enseña cuánto se gastó en cada categoría, de la que más a la que menos, con su porcentaje, y el total.
- **Borrar** pide el id de un gasto y lo borra.
- Cada gasto tiene un `id`: el mayor que haya más 1 (o 1 si no hay ninguno).

### Ejemplo

```txt
Elige una opción: 1
Fecha (AAAA-MM-DD): 2026-10-03
Descripción: Almuerzo
Categoría: Comida
Importe: 12,50
Gasto añadido (id: 1).
...
Elige una opción: 2
 ID  Fecha       Categoría       Importe  Descripción
  3  2026-09-28  ocio              18.00  Cine
  1  2026-10-03  comida            12.50  Almuerzo
  2  2026-10-05  transporte         2.30  Bus al centro
...
Elige una opción: 3
Mes (AAAA-MM, vacío para todos): 2026-10
Resumen de 2026-10 (2 gastos)
  comida            12.50   84%
  transporte         2.30   16%
Total: 14.80
```

### Restricciones

- Los gastos se guardan en `gastos.csv`, con las columnas `id`, `fecha`, `descripcion`, `categoria` e `importe` (con dos decimales). Si el archivo no existe, el programa empieza sin gastos.
- Usa el módulo `csv` de la biblioteca estándar: `csv.DictWriter` para escribir y `csv.DictReader` para leer.
- Cada cambio (añadir o borrar) se guarda en el archivo enseguida, para no perder nada si el programa se cierra.

### Cómo empezar

`csv.DictReader` lee cada fila como un diccionario con los nombres de las columnas, pero todos los valores llegan como **texto**: convierte el id con `int()` y el importe con `float()` al cargar.

Para comprobar una fecha, sepárala con `texto.split("-")`, mira que sean tres partes de cifras y crea la fecha con `date(año, mes, día)` del módulo `datetime`: si la fecha no existe, lanza `ValueError`. Y para el importe, cambia la coma por un punto antes de convertirlo con `float()`, dentro de un `try`.

Las f-strings alinean columnas: `f"{texto:<12}"` ocupa 12 caracteres alineado a la izquierda, `f"{numero:>9.2f}"` ocupa 9 alineado a la derecha con dos decimales y `f"{0.84:.0%}"` escribe `84%`.

En el curso, el disco se conserva entre ejecuciones: los gastos que apuntes siguen ahí la siguiente vez que ejecutes el programa. El botón **vaciar disco** los borra.

### Para ir más allá

Añade un presupuesto mensual y que el programa avise cuando lo superas, exporta el resumen a otro archivo o enseña una barra de texto (`"█" * n`) para cada categoría. Cuando hagas la ruta de pandas, prueba a analizar `gastos.csv` con un `groupby`.

## Objetivo

Escribe `gastos.py` con el menú y las cinco opciones. Las comprobaciones lo ejecutan varias veces seguidas con respuestas fijas, compartiendo el disco, y buscan estos mensajes:

- `Gasto añadido (id: 1).` al añadir, y `No hay gastos.` al ver o resumir sin gastos.
- `Fecha no válida`, `El importe debe ser un número mayor que 0.` y `Opción no válida` cuando un dato no vale.
- En el resumen: `Resumen de 2026-10 (3 gastos)` (o `Resumen de todos los gastos (4 gastos)`), una línea por categoría y `Total: 60.55`, con dos decimales. Si el mes no tiene gastos: `No hay gastos en 2026-08.`; y `Mes no válido` si está mal escrito.
- Al borrar: `Gasto 2 borrado.`, `No existe el gasto 9.` y `Escribe el número del gasto.` si no es un número.
- `¡Hasta pronto!` al salir.

Al final se revisa que `gastos.csv` tenga las columnas y los gastos que deben quedar.

## Pista

Escribe primero `cargar` y `guardar`, y una función por opción del menú que reciba la lista de gastos. Para los datos que hay que repetir hasta que estén bien, una función por dato con un `while True` que solo termina con `return` cuando el dato es válido:

```py
def pedir_importe():
    while True:
        texto = input("Importe: ").strip().replace(",", ".")
        try:
            importe = float(texto)
        except ValueError:
            importe = 0
        if importe > 0:
            return importe
        print("El importe debe ser un número mayor que 0.")
```

Para el resumen de un mes, quédate con los gastos cuya fecha empieza por el mes y un guion: `gasto["fecha"].startswith(mes + "-")`. Para sumar por categoría, un diccionario y `por_categoria.get(categoria, 0) + importe`.

## Solución

La solución de referencia carga los gastos una vez al empezar y guarda el archivo entero después de cada cambio. Las preguntas que se repiten (`pedir_fecha`, `pedir_texto`, `pedir_importe`) están separadas de las opciones del menú, así que `anadir` se lee casi como la lista de datos de un gasto.

Al guardar, `dict(gasto, importe=f"{gasto['importe']:.2f}")` crea una copia del gasto con el importe ya escrito con dos decimales, sin cambiar el original. Y el resumen ordena las categorías con `sorted(..., key=lambda par: par[1], reverse=True)`, que ordena las parejas (categoría, importe) por el importe, de mayor a menor.
