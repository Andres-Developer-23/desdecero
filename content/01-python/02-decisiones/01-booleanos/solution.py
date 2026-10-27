altura = int(input("Altura en cm: "))
edad = int(input("Edad: "))
con_adulto = input("¿Va con un adulto? (s/n): ") == "s"

puede_subir = (altura >= 140 and edad >= 10) or (con_adulto and altura >= 120)

print(f"¿Puede subir? {puede_subir}")
