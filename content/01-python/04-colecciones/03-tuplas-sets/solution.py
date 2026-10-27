curso_a = ["ana", "luis", "marta", "ana", "jorge"]
curso_b = ["marta", "pedro", "luis", "sofía", "luis"]

a = set(curso_a)
b = set(curso_b)

print(f"En ambos cursos: {sorted(a & b)}")
print(f"Personas distintas: {len(a | b)}")
