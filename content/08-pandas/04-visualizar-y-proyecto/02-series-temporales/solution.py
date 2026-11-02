import pandas as pd

MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
         "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]

ventas = pd.read_csv("ventas.csv", parse_dates=["fecha"]).set_index("fecha")
ventas["ingresos"] = ventas["unidades"] * ventas["precio_unitario"]

mensual = ventas["ingresos"].resample("ME").sum()
variacion = (mensual.pct_change() * 100).round(1)
for fecha, ingresos in mensual.items():
    texto = f"{MESES[fecha.month - 1]}: {ingresos} pesos"
    if pd.notna(variacion[fecha]):
        texto += f" ({variacion[fecha]:+.1f} %)"
    print(texto)
print("Mejor mes:", MESES[mensual.idxmax().month - 1])
