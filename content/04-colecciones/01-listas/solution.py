temps = [22, 25, 27, 19, 29, 26, 23]

promedio = sum(temps) / len(temps)
calurosos = 0
for t in temps:
    if t > 25:
        calurosos += 1

print(f"Promedio: {promedio:.2f}")
print(f"Máxima: {max(temps)}")
print(f"Días de más de 25°: {calurosos}")
