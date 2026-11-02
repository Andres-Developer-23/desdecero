import pandas as _pd

assert len(encuesta) == 48, "Deberían quedar las 48 respuestas sin repetir"
assert sorted(encuesta["ciudad"].unique()) == ["Barranquilla", "Bogotá", "Cali", "Medellín"], "ciudad debería tener solo Bogotá, Medellín, Cali y Barranquilla, y tiene " + str(sorted(encuesta["ciudad"].dropna().unique()))
assert encuesta["recomienda"].dtype == bool, "recomienda debería ser una columna de True y False, y es " + str(encuesta["recomienda"].dtype)
assert int(encuesta["recomienda"].sum()) == 39, "Deberían recomendarlo 39 clientes, y salen " + str(int(encuesta["recomienda"].sum()))
assert _pd.api.types.is_datetime64_any_dtype(encuesta["fecha"]), "fecha debería ser de fechas (pd.to_datetime)"
assert encuesta["fecha"].dt.month.between(1, 6).all(), "Todas las respuestas son de enero a junio: las fechas tienen el día primero, usa format=\"%d/%m/%Y\""
