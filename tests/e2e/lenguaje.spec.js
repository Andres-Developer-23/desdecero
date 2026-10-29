/*
 * Python que Skulpt hacía distinto de CPython: excepciones propias,
 * anotaciones sin valor, list[str] e imports interrumpidos por una pausa.
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

assert ft.Text and rq.get and Sopa
`,
  );
  expect(result.passed, result.log).toBe(true);
});
