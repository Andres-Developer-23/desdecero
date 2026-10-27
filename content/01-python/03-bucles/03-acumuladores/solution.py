suma_pares = 0
multiplos_7 = 0

for n in range(1, 101):
    if n % 2 == 0:
        suma_pares += n
    if n % 7 == 0:
        multiplos_7 += 1

print(f"Suma de pares: {suma_pares}")
print(f"Múltiplos de 7: {multiplos_7}")
