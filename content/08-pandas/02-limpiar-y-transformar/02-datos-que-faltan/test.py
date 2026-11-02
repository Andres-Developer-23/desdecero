import pandas as _pd

assert len(encuesta) == 45, "Después de limpiar deberían quedar 45 respuestas, y quedan " + str(len(encuesta))
assert not encuesta.duplicated().any(), "No deberían quedar filas repetidas"
assert _pd.api.types.is_integer_dtype(encuesta["edad"]), "edad debería ser una columna de enteros (astype(int)), y es " + str(encuesta["edad"].dtype)
assert _pd.api.types.is_numeric_dtype(encuesta["puntuacion"]), "puntuacion debería ser numérica (pd.to_numeric)"
assert encuesta["puntuacion"].notna().all() and encuesta["edad"].notna().all(), "No deberían quedar puntuaciones ni edades vacías"
assert (encuesta.loc[encuesta["id"] == 3, "edad"] == 42).all(), "La edad que faltaba en la respuesta 3 debería rellenarse con la mediana, 42"
