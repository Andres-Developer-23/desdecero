import flet as ft

# Cuántas unidades base (metros o kilos) hay en cada unidad.
LONGITUD = {"mm": 0.001, "cm": 0.01, "m": 1, "km": 1000, "in": 0.0254, "ft": 0.3048, "mi": 1609.344}
PESO = {"g": 0.001, "kg": 1, "oz": 0.028349523125, "lb": 0.45359237}
TEMPERATURA = ["°C", "°F", "K"]
CATEGORIAS = {
    "Longitud": list(LONGITUD),
    "Peso": list(PESO),
    "Temperatura": TEMPERATURA,
}
POR_DEFECTO = {"Longitud": "m", "Peso": "kg", "Temperatura": "°C"}


def convertir(valor, desde, hasta, categoria):
    """El valor en la unidad «desde» pasado a la unidad «hasta»."""
    # Tu código aquí


def formatear(numero):
    """Hasta 4 decimales y sin ceros de más: 1000.0 → "1000", 0.62137 → "0.6214"."""
    # Tu código aquí


def main(page: ft.Page):
    page.title = "Conversor de unidades"
    estado = {"categoria": "Longitud", "unidad": "m"}
    valor = ft.TextField(label="Valor", value="1")
    categorias = ft.Row()
    unidades = ft.Row(wrap=True)
    resultados = ft.Column()

    # Tu código aquí: los botones, sus eventos y el cálculo de los resultados

    page.add(
        ft.Text("Conversor de unidades", size=24, weight=ft.FontWeight.BOLD),
        categorias,
        valor,
        ft.Text("De:"),
        unidades,
        ft.Text("Equivale a:"),
        resultados,
    )


ft.run(main)
