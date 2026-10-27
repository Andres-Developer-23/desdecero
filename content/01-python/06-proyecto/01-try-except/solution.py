def a_numero(texto):
    try:
        return float(texto.replace(",", "."))
    except ValueError:
        return None

print(a_numero("42"))
print(a_numero("3,5"))
print(a_numero("hola"))
