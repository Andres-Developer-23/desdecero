---
title: Manejar errores con try / except
minutes: 20
summary: Capturar errores previsibles para que el programa siga funcionando.
---

Algunos errores no se deben a un fallo tuyo, sino a datos inesperados: el usuario escribe "veinte" cuando pedías un número, o un divisor llega a cero. En vez de dejar que el programa se detenga, puedes **capturar** el error con `try` y `except`:

```py
texto = "veinte"
try:
    numero = int(texto)
    print("Convertido:", numero)
except ValueError:
    print(f"'{texto}' no es un número válido")
print("El programa continúa")
```

Python intenta ejecutar el bloque `try`. Si ocurre un error del tipo indicado, salta al bloque `except` en lugar de detenerse. Si no ocurre nada, el `except` se ignora.

Puedes capturar errores distintos con varios `except`:

```py
def dividir(a, b):
    try:
        return a / b
    except ZeroDivisionError:
        return None

print(dividir(10, 4))
print(dividir(10, 0))
```

Una buena práctica: captura solo el tipo de error que esperas (`ValueError`, `ZeroDivisionError`...). Un `except` sin tipo atraparía cualquier error, incluidos los fallos de tu propio código, y te costaría mucho encontrarlos.

## Ejercicio

Escribe una función `a_numero(texto)` que intente convertir el texto a `float`. Si lo consigue, devuelve el número; si el texto no es un número válido, devuelve `None`.

Además, debe aceptar la **coma decimal**: `"3,5"` tiene que dar `3.5`.

## Pista

Dentro del try, cambia la coma por un punto con replace(",", ".") y convierte con float(). En el except ValueError: devuelve None.
