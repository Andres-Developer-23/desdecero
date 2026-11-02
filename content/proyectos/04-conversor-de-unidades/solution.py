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


def a_celsius(valor, unidad):
    if unidad == "°F":
        return (valor - 32) * 5 / 9
    if unidad == "K":
        return valor - 273.15
    return valor


def desde_celsius(celsius, unidad):
    if unidad == "°F":
        return celsius * 9 / 5 + 32
    if unidad == "K":
        return celsius + 273.15
    return celsius


def convertir(valor, desde, hasta, categoria):
    """El valor en la unidad «desde» pasado a la unidad «hasta»."""
    if categoria == "Temperatura":
        return desde_celsius(a_celsius(valor, desde), hasta)
    factores = LONGITUD if categoria == "Longitud" else PESO
    return valor * factores[desde] / factores[hasta]


def formatear(numero):
    """Hasta 4 decimales y sin ceros de más: 1000.0 → "1000", 0.62137 → "0.6214"."""
    texto = f"{numero:.4f}".rstrip("0").rstrip(".")
    return "0" if texto == "-0" else texto


def leer_numero(texto):
    """El número escrito (con punto o coma decimal), o None si no es un número."""
    try:
        return float(texto.strip().replace(",", "."))
    except ValueError:
        return None


def main(page: ft.Page):
    page.title = "Conversor de unidades"
    estado = {"categoria": "Longitud", "unidad": "m"}
    valor = ft.TextField(label="Valor", value="1", on_change=lambda e: calcular())
    categorias = ft.Row()
    unidades = ft.Row(wrap=True)
    resultados = ft.Column()

    def elegir_categoria(categoria):
        estado["categoria"] = categoria
        estado["unidad"] = POR_DEFECTO[categoria]
        dibujar_botones()
        calcular()

    def elegir_unidad(unidad):
        estado["unidad"] = unidad
        dibujar_botones()
        calcular()

    def boton(texto, elegido, al_pulsar):
        tipo = ft.FilledButton if elegido else ft.OutlinedButton
        return tipo(content=texto, on_click=lambda e: al_pulsar(texto))

    def dibujar_botones():
        categorias.controls = [
            boton(nombre, nombre == estado["categoria"], elegir_categoria) for nombre in CATEGORIAS
        ]
        unidades.controls = [
            boton(unidad, unidad == estado["unidad"], elegir_unidad)
            for unidad in CATEGORIAS[estado["categoria"]]
        ]

    def calcular():
        resultados.controls.clear()
        valor.error = None
        if not valor.value.strip():
            return
        numero = leer_numero(valor.value)
        if numero is None:
            valor.error = "Escribe un número"
            return
        desde = estado["unidad"]
        for hasta in CATEGORIAS[estado["categoria"]]:
            if hasta != desde:
                convertido = convertir(numero, desde, hasta, estado["categoria"])
                resultados.controls.append(ft.Text(f"{formatear(convertido)} {hasta}"))

    dibujar_botones()
    calcular()
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
