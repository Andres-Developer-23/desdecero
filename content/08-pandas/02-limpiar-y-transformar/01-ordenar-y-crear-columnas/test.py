assert "total" in ventas.columns and "tamano" in ventas.columns, "ventas debería tener las columnas total y tamano"
assert (ventas["total"] == ventas["unidades"] * ventas["precio_unitario"]).all(), "total debería ser unidades × precio_unitario"
assert set(ventas.loc[ventas["total"] >= 30000, "tamano"]) == {"grande"}, "Las ventas de 30000 o más deberían ser «grande»"
assert set(ventas.loc[ventas["total"] < 30000, "tamano"]) == {"normal"}, "Las ventas de menos de 30000 deberían ser «normal»"
