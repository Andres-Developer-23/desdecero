---
title: Diccionarios
minutes: 20
summary: Pares clave-valor para buscar datos por nombre en lugar de por posición.
---

Una lista te da los datos por posición. Un **diccionario** te los da por **nombre**: guarda pares `clave: valor` entre llaves.

```py
persona = {"nombre": "Camila", "edad": 31, "ciudad": "Bogotá"}
print(persona["nombre"])
persona["edad"] = 32                    # cambia un valor
persona["profesion"] = "analista"       # añade una clave nueva
print(persona)
```

Si pides con corchetes una clave que no existe, obtienes un `KeyError`. El método `.get()` es más seguro: devuelve un valor por defecto en lugar de fallar.

```py
precios = {"café": 4500, "pan": 1200}
print(precios.get("té", 0))   # 0: no existe
print("café" in precios)      # True: in busca entre las claves
```

Para recorrer un diccionario, `.items()` te da cada clave junto con su valor:

```py
inventario = {"lápices": 12, "cuadernos": 5, "borradores": 0}
for producto, cantidad in inventario.items():
    if cantidad == 0:
        print(f"{producto}: agotado")
    else:
        print(f"{producto}: {cantidad} unidades")
```

Un patrón muy común es usar un diccionario para **contar**: la clave es lo que cuentas y el valor, cuántas veces apareció.

## Ejercicio

Tienes un diccionario `precios` y una lista `carrito` con lo que compró un cliente (un producto puede repetirse). Calcula `total` recorriendo el carrito y buscando el precio de cada producto en el diccionario. La salida debe ser `Total: 13700`.

## Pista

Escribe un for producto in carrito: y, dentro, suma a total el valor precios[producto].
