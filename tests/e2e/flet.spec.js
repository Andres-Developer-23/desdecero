/* Simulador de Flet: vista previa interactiva, errores y ayudas de prueba. */

import { expect, openApp, test } from "./fixtures.js";

const CONTADOR = `import flet as ft

def main(page: ft.Page):
    page.title = "Contador"
    contador = ft.Text("0", size=40)

    def sumar(e):
        contador.value = str(int(contador.value) + 1)
        print("clic", contador.value)

    page.add(
        contador,
        ft.Button(content="Sumar", on_click=sumar),
        ft.TextField(label="Nombre", on_change=lambda e: print("hola", e.control.value)),
        ft.Checkbox(label="Acepto", on_change=lambda: print("casilla")),
    )

ft.run(main)
`;

/** Pone código en el editor del playground y lo ejecuta. */
async function runInPlayground(page, code) {
  await page.evaluate((source) => {
    document.querySelector("#playground-editor .CodeMirror").CodeMirror.setValue(source);
  }, code);
  await page.locator("#view-playground [data-action='run']").click();
}

/** Ejecuta código Python con las comprobaciones de un ejercicio y devuelve el informe. */
async function check(page, code, test) {
  return page.evaluate(
    async ({ code, test }) => {
      const { checkExercise, createTerminal } = window.__desdecero;
      const output = document.createElement("pre");
      const result = await checkExercise({ checks: {}, test }, code, createTerminal(output));
      return { ...result, log: output.textContent };
    },
    { code, test },
  );
}

test("el playground muestra la app y responde a clics, texto y casillas", async ({ page }) => {
  await openApp(page, "#playground");
  await runInPlayground(page, CONTADOR);

  const preview = page.locator("#playground-preview");
  await expect(preview.locator(".flet-window__titlebar")).toHaveText("Contador");
  const button = preview.locator(".flet-button", { hasText: "Sumar" });
  await button.click();
  await button.click();
  await expect(preview.locator(".flet-text").first()).toHaveText("2");

  const field = preview.locator("input.flet-textfield__input");
  await field.pressSequentially("Ana");
  await expect(field).toHaveValue("Ana");
  await expect(field).toBeFocused();
  await preview.locator(".flet-toggle--checkbox").click();

  const output = page.locator("#playground-output");
  await expect(output).toContainText("clic 2");
  await expect(output).toContainText("hola Ana");
  await expect(output).toContainText("casilla");
});

test("la vista previa se detiene al ejecutar otro programa", async ({ page }) => {
  await openApp(page, "#playground");
  await runInPlayground(page, CONTADOR);
  await expect(page.locator("#playground-preview .flet-button")).toBeVisible();
  await runInPlayground(page, 'print("sin flet")');
  await expect(page.locator("#playground-preview")).toBeHidden();
  await expect(page.locator("#playground-output")).toContainText("sin flet");
});

test("un programa de Flet sin ft.run(main) lo explica", async ({ page }) => {
  await openApp(page, "#playground");
  await runInPlayground(
    page,
    "import flet as ft\n\ndef main(page):\n    page.add(ft.Text('hola'))\n",
  );
  await expect(page.locator("#playground-preview")).toContainText("no llamó a ft.run(main)");
});

test("los nombres eliminados en Flet 1.0 explican cómo se escriben ahora", async ({ page }) => {
  await openApp(page);
  const result = await check(
    page,
    "import flet as ft",
    [
      "intentos = [",
      "    lambda: ft.app(None),",
      "    lambda: ft.ElevatedButton(),",
      "    lambda: ft.alignment.center,",
      "    lambda: ft.Button(text='x'),",
      "]",
      "for intento in intentos:",
      "    try:",
      "        intento()",
      "    except Exception as error:",
      "        print(error)",
    ].join("\n"),
  );
  expect(result.log).toContain("ft.app() ya no existe en Flet 1.0: usa ft.run(main)");
  expect(result.log).toContain("ft.ElevatedButton ya no existe en Flet 1.0");
  expect(result.log).toContain("usa ft.Alignment.CENTER");
  expect(result.log).toContain("el texto del botón va en content=");
});

test("fletsim prueba apps: controles propios, clics, texto y casillas", async ({ page }) => {
  await openApp(page);
  const code = `import flet as ft
from dataclasses import field
from typing import Callable

@ft.control
class Tarea(ft.Row):
    nombre: str = ""
    al_borrar: Callable = field(default=lambda tarea: None)

    def init(self):
        self.casilla = ft.Checkbox(label=self.nombre)
        self.controls = [self.casilla, ft.IconButton(icon=ft.Icons.DELETE, on_click=self.borrar)]

    def borrar(self):
        self.al_borrar(self)

def main(page: ft.Page):
    lista = ft.Column()
    nueva = ft.TextField(label="Tarea")

    def agregar(e):
        lista.controls.append(Tarea(nombre=nueva.value, al_borrar=quitar))
        nueva.value = ""

    def quitar(tarea):
        lista.controls.remove(tarea)

    page.add(nueva, ft.Button(content="Añadir", on_click=agregar), lista)

ft.run(main)
`;
  const result = await check(
    page,
    code,
    [
      "from fletsim import *",
      "type_text(find_one(ft.TextField), 'Pan')",
      "click('Añadir')",
      "tarea = find_one(Tarea)",
      "assert tarea.nombre == 'Pan'",
      "assert find_one(ft.TextField).value == ''",
      "toggle(tarea.casilla)",
      "assert tarea.casilla.value is True",
      "click(find_one(ft.IconButton))",
      "assert find(Tarea) == []",
      "assert 'Pan' not in screen_text()",
    ].join("\n"),
  );
  expect(result.passed, result.log).toBe(true);
});
