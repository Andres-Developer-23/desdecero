/*
 * Python que Skulpt no traía o hacía distinto de CPython: excepciones
 * propias, anotaciones sin valor, list[str], abc, dataclasses, json,
 * functools y comparaciones con métodos especiales que tienen bucles.
 */

import { expect, openApp, test } from "./fixtures.js";

/** Ejecuta el programa con el comprobador y devuelve el informe. */
async function run(page, code) {
  return page.evaluate(async (source) => {
    const { checkExercise, createTerminal } = window.__desdecero;
    const output = document.createElement("pre");
    const result = await checkExercise({ checks: {}, test: "" }, source, createTerminal(output));
    return { ...result, log: output.textContent };
  }, code);
}

test.beforeEach(async ({ page }) => {
  await openApp(page);
});

test("una excepción propia cambia su mensaje con super().__init__()", async ({ page }) => {
  const result = await run(
    page,
    `class SaldoInsuficiente(Exception):
    def __init__(self, saldo, monto):
        super().__init__(f"Saldo insuficiente: tienes {saldo} y quieres sacar {monto}")
        self.saldo = saldo

try:
    raise SaldoInsuficiente(10, 50)
except SaldoInsuficiente as error:
    assert str(error) == "Saldo insuficiente: tienes 10 y quieres sacar 50", str(error)
    assert error.args == ("Saldo insuficiente: tienes 10 y quieres sacar 50",)
    assert error.saldo == 10

class Simple(Exception):
    pass

assert str(Simple("hola")) == "hola"
assert Simple("a", 1).args == ("a", 1)
assert repr(ValueError("x")) == "ValueError('x')"
`,
  );
  expect(result.passed, result.log).toBe(true);
});

test("una excepción propia sin capturar enseña su mensaje", async ({ page }) => {
  const result = await run(
    page,
    `class Agotado(Exception):
    def __init__(self, producto):
        super().__init__(f"No quedan unidades de {producto}")

raise Agotado("pan")
`,
  );
  expect(result.passed).toBe(false);
  expect(result.log).toContain("Agotado");
  expect(result.log).toContain("No quedan unidades de pan");
});

test("super() funciona aunque la clase base tenga __str__", async ({ page }) => {
  const result = await run(
    page,
    `class Cuenta:
    def __init__(self, numero):
        self.numero = numero

    def __str__(self):
        return f"Cuenta {self.numero}"

class CuentaAhorro(Cuenta):
    def __init__(self, numero, tasa):
        super().__init__(numero)
        self.tasa = tasa

    def __str__(self):
        return super().__str__() + f" al {self.tasa * 100:.0f} %"

assert str(CuentaAhorro(7, 0.02)) == "Cuenta 7 al 2 %", str(CuentaAhorro(7, 0.02))

def fuera_de_una_clase():
    return super()

try:
    fuera_de_una_clase()
    assert False, "super() fuera de un método debería fallar"
except RuntimeError:
    pass
`,
  );
  expect(result.passed, result.log).toBe(true);
});

test("las anotaciones sin valor y list[str] se pueden escribir", async ({ page }) => {
  const result = await run(
    page,
    `class Ficha:
    nombre: str
    notas: list[int] = []

def media(valores: list[float]) -> float:
    total: float
    total = sum(valores)
    return total / len(valores)

assert media([1, 2, 3]) == 2
assert Ficha.notas == []
assert dict[str, int] is dict
`,
  );
  expect(result.passed, result.log).toBe(true);
});

test("abc impide instanciar una clase abstracta incompleta", async ({ page }) => {
  const result = await run(
    page,
    `from abc import ABC, abstractmethod

class Figura(ABC):
    @abstractmethod
    def area(self):
        pass

    @abstractmethod
    def perimetro(self):
        pass

class Cuadrado(Figura):
    def __init__(self, lado):
        self.lado = lado

    def area(self):
        return self.lado ** 2

    def perimetro(self):
        return 4 * self.lado

class Incompleta(Figura):
    def area(self):
        return 0

assert Cuadrado(3).area() == 9 and isinstance(Cuadrado(1), Figura)
for clase, mensaje in [
    (Figura, "Can't instantiate abstract class Figura without an implementation for abstract methods 'area', 'perimetro'"),
    (Incompleta, "Can't instantiate abstract class Incompleta without an implementation for abstract method 'perimetro'"),
]:
    try:
        clase()
        assert False, "debería lanzar TypeError"
    except TypeError as error:
        assert str(error) == mensaje, str(error)
`,
  );
  expect(result.passed, result.log).toBe(true);
});

test("@dataclass escribe __init__, __repr__ y __eq__ como en CPython", async ({ page }) => {
  const result = await run(
    page,
    `from dataclasses import dataclass, field, asdict, replace, FrozenInstanceError

@dataclass
class Producto:
    nombre: str
    precio: float
    cantidad: int = 1
    etiquetas: list = field(default_factory=list)

p = Producto("Pan", 2.5)
assert repr(p) == "Producto(nombre='Pan', precio=2.5, cantidad=1, etiquetas=[])", repr(p)
assert p == Producto("Pan", 2.5) and p != Producto("Pan", 3)
p.etiquetas.append("comida")
assert Producto("Leche", 1).etiquetas == [], "cada instancia tiene su propia lista"
assert asdict(p)["etiquetas"] == ["comida"]
assert replace(p, precio=3.0).precio == 3.0
assert Producto.cantidad == 1 and not hasattr(Producto, "nombre")

try:
    Producto("Leche")
    assert False
except TypeError as error:
    assert str(error) == "__init__() missing 1 required positional argument: 'precio'", str(error)

try:
    @dataclass
    class Mala:
        a: list = []
    assert False
except ValueError as error:
    assert "use default_factory" in str(error)

@dataclass(order=True)
class Version:
    mayor: int
    menor: int = 0

assert sorted([Version(2, 1), Version(1, 9)]) == [Version(1, 9), Version(2, 1)]

@dataclass(frozen=True)
class Punto:
    x: int
    y: int

try:
    Punto(1, 2).x = 5
    assert False
except FrozenInstanceError:
    pass
assert len({Punto(1, 2), Punto(1, 2)}) == 1

@dataclass
class Empleado:
    nombre: str
    sueldo: int = 1000

@dataclass
class Gerente(Empleado):
    equipo: list = field(default_factory=list)

    def __post_init__(self):
        self.sueldo *= 2

assert repr(Gerente("Ana", 1500)) == "Gerente(nombre='Ana', sueldo=3000, equipo=[])"
`,
  );
  expect(result.passed, result.log).toBe(true);
});

test("json lee y escribe como en CPython, con los mismos errores", async ({ page }) => {
  const result = await run(
    page,
    `import json

datos = json.loads('{"titulo": "El a\\\\u00f1o", "precio": 12.5, "paginas": 320, "stock": null, "tags": ["a", true]}')
assert datos == {"titulo": "El año", "precio": 12.5, "paginas": 320, "stock": None, "tags": ["a", True]}
assert type(datos["paginas"]) is int and type(datos["precio"]) is float
assert json.loads("[1.0, 12345678901234567890]") == [1.0, 12345678901234567890]

assert json.dumps({"b": 1, "a": [1, 2.0, None]}) == '{"b": 1, "a": [1, 2.0, null]}'
assert json.dumps("ñ") == '"\\\\u00f1"' and json.dumps("ñ", ensure_ascii=False) == '"ñ"'
assert json.dumps({"b": 1, "a": {}}, indent=2, sort_keys=True) == '{\\n  "a": {},\\n  "b": 1\\n}'
assert json.dumps([1, 2], separators=(",", ":")) == "[1,2]"
assert json.dumps({1: True}) == '{"1": true}'
assert json.dumps({"s": {3}}, default=list) == '{"s": [3]}'

try:
    json.dumps({"s": {3}})
    assert False
except TypeError as error:
    assert str(error) == "Object of type set is not JSON serializable", str(error)

try:
    json.loads('{\\n  "a": 1,\\n}')
    assert False
except json.JSONDecodeError as error:
    assert isinstance(error, ValueError)
    assert str(error) == "Illegal trailing comma before end of object: line 2 column 9 (char 10)", str(error)
    assert (error.msg, error.lineno, error.colno, error.pos) == ("Illegal trailing comma before end of object", 2, 9, 10)

try:
    json.loads("{'a': 1}")
    assert False
except ValueError as error:
    assert str(error).startswith("Expecting property name enclosed in double quotes")
`,
  );
  expect(result.passed, result.log).toBe(true);
});

test("in y == funcionan con __contains__ y __eq__ propios que tienen bucles", async ({ page }) => {
  const result = await run(
    page,
    `class Cabeceras:
    def __init__(self, pares):
        self.pares = pares

    def __contains__(self, nombre):
        for clave, valor in self.pares:
            if clave.lower() == nombre.lower():
                return True
        return False

    def __eq__(self, otra):
        return sorted(k.lower() for k, v in self.pares) == sorted(k.lower() for k, v in otra.pares)


c = Cabeceras([("Host", "localhost"), ("Accept", "*/*")])
assert "host" in c
assert "User-Agent" not in c
assert ("x" in c) is False
encontradas = [n for n in ["Host", "Cookie", "accept"] if n in c]
assert encontradas == ["Host", "accept"], encontradas
assert c == Cabeceras([("accept", "1"), ("HOST", "2")])
assert not (c == Cabeceras([("Host", "1")]))
`,
  );
  expect(result.passed, result.log).toBe(true);
});

test("functools: wraps conserva el nombre de la función decorada", async ({ page }) => {
  const result = await run(
    page,
    `from functools import lru_cache, partial, reduce, wraps


def registrar(funcion):
    @wraps(funcion)
    def envoltura(*args, **kwargs):
        return funcion(*args, **kwargs)
    return envoltura


@registrar
def saludar(nombre):
    """Devuelve un saludo."""
    return "Hola, " + nombre


assert saludar("Ana") == "Hola, Ana"
assert saludar.__name__ == "saludar" and saludar.__doc__ == "Devuelve un saludo."
assert saludar.__wrapped__("Luis") == "Hola, Luis"
assert partial(int, base=2)("101") == 5
assert reduce(lambda a, b: a * b, [1, 2, 3, 4]) == 24


@lru_cache(maxsize=None)
def fibonacci(n):
    return n if n < 2 else fibonacci(n - 1) + fibonacci(n - 2)


assert fibonacci(80) == 23416728348467685
`,
  );
  expect(result.passed, result.log).toBe(true);
});

test("los imports no se pierden aunque el motor haga pausas", async ({ page }) => {
  // Fuerza una pausa en cada comprobación: así una pausa siempre cae en mitad de un import.
  await page.evaluate(() => {
    const configure = window.Sk.configure;
    window.Sk.configure = (options) => configure({ ...options, yieldLimit: 0 });
  });
  const result = await run(
    page,
    `import flet as ft
import requests as rq
from bs4 import BeautifulSoup as Sopa
from dataclasses import dataclass as clase_de_datos

assert ft.Text and rq.get and Sopa and clase_de_datos
`,
  );
  expect(result.passed, result.log).toBe(true);
});
