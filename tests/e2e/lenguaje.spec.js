/*
 * Python que Skulpt no traía o hacía distinto de CPython: excepciones
 * propias, anotaciones sin valor, list[str], abc y dataclasses.
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
