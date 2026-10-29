/* Recorridos principales de la interfaz, en escritorio y en móvil. */

import { expect, openApp, test } from "./fixtures.js";

test("el panel muestra las rutas y el siguiente paso", async ({ page }) => {
  await openApp(page);
  const python = page.getByRole("article", { name: "Python desde cero" });
  await expect(python).toBeVisible();
  await expect(python).toContainText("0/20");
  const flet = page.getByRole("article", { name: "Apps con Flet" });
  await expect(flet).toContainText("0/12");
  await expect(flet).toContainText("Antes conviene terminar «Python desde cero»");
  const scraping = page.getByRole("article", { name: "Web scraping con Python" });
  await expect(scraping).toContainText("0/12");
  const poo = page.getByRole("article", { name: "Programación orientada a objetos" });
  await expect(poo).toContainText("0/12");
  // Las rutas siguen el orden de las carpetas: Python, POO, Flet y scraping.
  await expect(page.locator(".route-card h3")).toHaveText([
    /Python desde cero/,
    /Programación orientada a objetos/,
    /Apps con Flet/,
    /Web scraping con Python/,
  ]);
  await expect(page.locator("#panel-actions .cta--primary")).toContainText(
    "empezar: Tu primer programa",
  );
});

test("la página de una ruta muestra sus módulos y lecciones", async ({ page }) => {
  await openApp(page, "#ruta-python");
  await expect(page.locator("#route-title")).toHaveText("Python desde cero");
  await expect(page.locator(".module")).toHaveCount(7);
  await expect(page.locator(".lesson-link")).toHaveCount(20);
  await expect(page.locator(".lesson-link--next")).toContainText("Tu primer programa");
  await expect(page.locator("[data-nav='rutas']")).toHaveAttribute("aria-current", "page");
});

test("la ruta de Flet tiene sus propios módulos y su numeración", async ({ page }) => {
  await openApp(page, "#ruta-flet");
  await expect(page.locator("#route-title")).toHaveText("Apps con Flet");
  await expect(page.locator(".module")).toHaveCount(5);
  await expect(page.locator(".lesson-link")).toHaveCount(12);
  await expect(page.locator(".lesson-link").first()).toContainText("Hola, Flet");
});

test("los enlaces de la versión 1.x siguen funcionando", async ({ page }) => {
  await openApp(page, "#ruta");
  await expect(page.locator("#route-title")).toHaveText("Python desde cero");
});

test("ejecutar un programa con input() muestra la salida en la consola", async ({ page }) => {
  await openApp(page, "#l-input");
  await page.locator("[data-action='run']").first().click();

  const answer = page.locator("#exercise-output .console__stdin input");
  await answer.fill("7");
  await answer.press("Enter");
  await answer.fill("5");
  await answer.press("Enter");

  await expect(page.locator("#exercise-output")).toContainText("La suma es 75");
});

test("superar un ejercicio completa la lección y actualiza el panel", async ({ page }) => {
  await openApp(page, "#l-hola-mundo");
  await page.locator("#exercise-solution").click();
  await page.locator("#exercise-solution").click();
  await page.locator("[data-action='check']").click();

  await expect(page.locator("#exercise-success")).toBeVisible();
  await expect(page.locator("#exercise-badge")).toHaveText("superado");

  await page.locator("#exercise-success-link").click();
  await expect(page).toHaveURL(/#l-calculadora$/);

  await page.goto("/#panel");
  await expect(page.locator(".stat").first()).toContainText("1");
  await expect(page.locator(".route-card").first()).toContainText("1/20");

  await page.goto("/#ruta-python");
  await expect(page.locator(".lesson-link--done")).toHaveCount(1);
  await expect(page.locator(".lesson-link--next")).toContainText("Python como calculadora");
});

test("un error de sintaxis se explica y marca la línea", async ({ page }) => {
  await openApp(page, "#l-errores");
  await page.locator("[data-action='check']").click();

  const output = page.locator("#exercise-output");
  await expect(output).toContainText("SyntaxError en la línea 1");
  await expect(output).toContainText("cierres comillas");
  await expect(page.locator(".editor__error-line")).toHaveCount(1);
});

test("los ejemplos se ejecutan y se pueden abrir en el playground", async ({ page }) => {
  await openApp(page, "#l-calculadora");
  const example = page.locator(".example").first();
  await example.locator("[data-action='run-example']").click();
  await expect(example.locator(".example__output")).toContainText("10\n4\n21\n3.5");

  await example.locator("[data-action='edit-example']").click();
  await expect(page).toHaveURL(/#playground$/);
  await expect(page.locator("#playground-editor")).toContainText("print(7 + 3)");
});

test("detener corta un bucle infinito", async ({ page }) => {
  await openApp(page, "#playground");
  await page.evaluate(() => {
    document
      .querySelector("#playground-editor .CodeMirror")
      .CodeMirror.setValue("while True:\n    pass\n");
  });
  await page.locator("#view-playground [data-action='run']").click();
  const stop = page.locator("#view-playground [data-action='stop']");
  await expect(stop).toBeVisible();
  await stop.click();
  await expect(page.locator("#playground-output")).toContainText("programa detenido");
  await expect(stop).toBeHidden();
});

test("ninguna página se desborda a lo ancho", async ({ page }) => {
  await openApp(page);
  const lessons = await page.evaluate(() =>
    window.__desdecero.course.routes.flatMap((route) =>
      route.modules.flatMap((module) => module.lessons.map((lesson) => lesson.id)),
    ),
  );
  const routes = await page.evaluate(() =>
    window.__desdecero.course.routes.map((route) => route.id),
  );
  const hashes = [
    "#panel",
    "#playground",
    ...routes.map((id) => `#ruta-${id}`),
    ...lessons.map((id) => `#l-${id}`),
  ];
  for (const hash of hashes) {
    await page.evaluate((target) => {
      location.hash = target;
    }, hash);
    await expect(page).toHaveURL(new RegExp(`${hash}$`));
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `desbordamiento horizontal en ${hash}`).toBeLessThanOrEqual(0);
  }
});
