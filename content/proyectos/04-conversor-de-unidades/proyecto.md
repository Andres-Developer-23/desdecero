---
title: Conversor de unidades
level: principiante
tags: [Flet, Interfaces]
minutes: 60
runtime: flet
requires: flet
file: conversor.py
summary: "Una app con Flet que convierte longitudes, pesos y temperaturas mientras escribes."
---

¿Cuántos pies son 5 kilómetros? ¿Y 100 °F en grados Celsius? Vas a construir una **app de conversión de unidades** con Flet: eliges el tipo de medida, escribes un valor, eliges su unidad y la app enseña al instante cuánto es en todas las demás.

Este proyecto junta lo que aprendiste en la ruta de Flet (controles, eventos y actualizar la pantalla) con un poco de lógica: una buena idea para separar **los cálculos** (funciones normales de Python, fáciles de probar) de **la interfaz** (los controles y sus eventos).

### Requisitos

- Tres botones arriba para elegir el tipo de medida: **Longitud**, **Peso** y **Temperatura**.
- Un campo de texto con la etiqueta **Valor**, que empieza con `1`.
- Una fila de botones con las unidades del tipo elegido, para decir en qué unidad está el valor. Para la longitud: `mm`, `cm`, `m`, `km`, `in`, `ft` y `mi`; para el peso: `g`, `kg`, `oz` y `lb`; y para la temperatura: `°C`, `°F` y `K`.
- Al elegir un tipo de medida, la unidad pasa a ser la principal de ese tipo: `m`, `kg` o `°C`.
- Debajo, un texto por cada una de las **otras** unidades con el valor convertido, como `1000 mm` o `3.1069 mi`. Se actualizan en cuanto cambia el valor, el tipo o la unidad.
- Los números se escriben con hasta 4 decimales y sin ceros de más: `1000`, no `1000.0000`; `0.6214`, no `0.621371`.
- El valor acepta punto o coma decimal (`2.5` o `2,5`) y números negativos (hay temperaturas bajo cero). Si no es un número, el campo enseña el error `Escribe un número` y no hay resultados. Si está vacío, no hay resultados, pero tampoco error.
- El botón del tipo y el de la unidad elegidos se distinguen de los demás.

### Las conversiones

Para la longitud y el peso, lo más sencillo es pasar por una **unidad base**: convierte el valor a metros (o kilos) y de ahí a la unidad que quieras. Basta con saber cuántos metros (o kilos) hay en cada unidad:

```txt
longitud, en metros            peso, en kilos
  mm   0.001                     g    0.001
  cm   0.01                      kg   1
  m    1                         oz   0.028349523125
  km   1000                      lb   0.45359237
  in   0.0254   (pulgada)
  ft   0.3048   (pie)
  mi   1609.344 (milla)
```

Así, 5 km son `5 * 1000 / 0.3048 = 16404.1995` pies: el valor por los metros de su unidad, entre los metros de la otra.

La temperatura no funciona con un factor, porque las escalas no empiezan en el mismo cero. Pasa por grados Celsius:

- de °F a °C: `(f - 32) * 5 / 9`; de °C a °F: `c * 9 / 5 + 32`
- de K a °C: `k - 273.15`; de °C a K: `c + 273.15`

### Cómo empezar

Escribe y prueba primero las funciones de cálculo, sin Flet: `convertir(valor, desde, hasta, categoria)` y `formatear(numero)`. Para quitar los ceros sobrantes, escribe el número con 4 decimales y quítalos por la derecha: `f"{numero:.4f}".rstrip("0").rstrip(".")`.

Para la interfaz, guarda en un diccionario el tipo y la unidad elegidos, y escribe una función que **vuelva a dibujar** las filas de botones (con un `ft.FilledButton` para el elegido y `ft.OutlinedButton` para los demás) y otra que vuelva a calcular los resultados. Llama a las dos cada vez que algo cambia. El evento `on_change` del campo de texto avisa en cada tecla.

Para que cada botón de unidad sepa qué unidad es, crea su manejador con una `lambda`: `on_click=lambda e: elegir_unidad(texto)`, dentro de una función que reciba `texto`.

### Para ir más allá

Añade más tipos de medida (volumen, velocidad, datos: KB, MB, GB…), un botón para intercambiar la unidad de origen con otra o un historial de las últimas conversiones.

## Objetivo

Escribe la app en `conversor.py`. Las comprobaciones la usan como lo harías tú: escriben en el campo, pulsan los botones y miran los textos de los resultados. Por ejemplo:

- Al abrirla, con `1` en `m`: `1000 mm`, `0.001 km`… (y nunca la unidad de origen, `1 m`).
- `5` en `km`: `5000 m`, `500000 cm`, `3.1069 mi` y `16404.1995 ft`. Con `2,5`: `2500 m`.
- `diez`: el error `Escribe un número` en el campo (`campo.error`) y ningún resultado.
- Temperatura, `100` en `°C`: `212 °F` y `373.15 K`. `32` en `°F`: `0 °C`. `-40` en `°F`: `-40 °C`.
- Peso, `1` en `lb`: `453.5924 g`, `0.4536 kg` y `16 oz`.

Cada resultado es un `ft.Text` con el número y la unidad separados por un espacio.

## Pista

Una estructura posible para `main`:

```py
estado = {"categoria": "Longitud", "unidad": "m"}
valor = ft.TextField(label="Valor", value="1", on_change=lambda e: calcular())
categorias = ft.Row()
unidades = ft.Row(wrap=True)
resultados = ft.Column()
```

`calcular()` vacía `resultados.controls`, quita el error (`valor.error = None`), y si el valor es un número, añade un `ft.Text` por cada unidad distinta de la elegida. Si no lo es, pone `valor.error = "Escribe un número"`.

Para el `-0` que puede salir al redondear un número negativo muy pequeño, comprueba el texto al final de `formatear`.

## Solución

La solución de referencia guarda las unidades de longitud y peso en diccionarios (unidad → cuántas unidades base tiene), así que añadir una unidad nueva es añadir una línea. `convertir` decide si usar los factores o las fórmulas de temperatura según la categoría.

En la interfaz, las filas de botones se reconstruyen enteras cada vez que cambia la elección (`dibujar_botones`): es más sencillo que cambiar el estilo de un botón concreto y, con tan pocos botones, no se nota. Los manejadores de los eventos solo cambian el estado y llaman a `dibujar_botones` y `calcular`; Flet actualiza la página al terminar cada evento.
