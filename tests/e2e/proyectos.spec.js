/*
 * La sección de proyectos: el catálogo con sus filtros, la página de cada
 * proyecto (pasos, detalle y soluciones) y los programas de línea de
 * comandos, con sus argumentos, sys.exit() y un disco que se conserva.
 */

import { expect, openApp, test } from "./fixtures.js";

/** Pone código en el editor del ejercicio (o del proyecto). */
async function setCode(page, code) {
  await page.evaluate((source) => {
    document.querySelector("#exercise-editor .CodeMirror").CodeMirror.setValue(source);
  }, code);
}

/** Ejecuta código con unas comprobaciones y devuelve el informe. */
async function check(page, code, checks, { test: testCode = "", file = "programa.py" } = {}) {
  return page.evaluate(
    async ({ code, checks, testCode, file }) => {
      const { checkExercise, createTerminal } = window.__desdecero;
      const output = document.createElement("pre");
      const result = await checkExercise(
        { checks, test: testCode, file },
        code,
        createTerminal(output),
      );
      return { ...result, log: output.textContent };
    },
    { code, checks, testCode, file },
  );
}

test("el catálogo filtra por nivel y por tema, y recuerda los filtros", async ({ page }) => {
  await openApp(page, "#proyectos");
  await expect(page.locator("[data-nav='proyectos']")).toHaveAttribute("aria-current", "page");
  const cards = page.locator(".project-card");
  const total = await cards.count();
  expect(total).toBeGreaterThanOrEqual(6);
  await expect(page.locator("#projects-progress")).toContainText(`0/${total}`);

  const levels = page.locator("#projects-levels");
  await levels.getByRole("button", { name: /^principiante/ }).click();
  await expect(levels.getByRole("button", { name: /^principiante/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(cards.locator(".level--intermedio, .level--avanzado")).toHaveCount(0);

  await page.locator("#projects-tags").getByRole("button", { name: /^CLI/ }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards).toContainText("Gestor de tareas");

  // Los filtros se recuerdan al volver.
  await page.reload();
  await expect(cards).toHaveCount(1);
  await page.getByRole("button", { name: "× limpiar filtros" }).click();
  await expect(cards).toHaveCount(total);

  // Toda la tarjeta lleva al proyecto.
  await cards.filter({ hasText: "Control de gastos" }).click({ position: { x: 20, y: 140 } });
  await expect(page).toHaveURL(/#p-control-de-gastos$/);
  await expect(page.locator("#lesson-title")).toHaveText("Control de gastos");
});

test("un proyecto tiene pasos, detalle y una pestaña de soluciones", async ({ page }) => {
  await openApp(page, "#p-gestor-de-tareas");
  await expect(page.locator("[data-nav='proyectos']")).toHaveAttribute("aria-current", "page");
  await expect(page.locator("#exercise-file")).toHaveText("tareas.py");
  await expect(page.locator(".project-steps__step--current")).toContainText("lee el detalle");
  await expect(page.locator("#lesson-body")).toContainText("Propiedades de cada tarea");

  const tabs = page.locator("#project-tabs");
  await tabs.getByRole("tab", { name: "soluciones" }).click();
  await expect(page.locator("#lesson-body")).toBeHidden();
  const solutions = page.locator("#project-solutions");
  await expect(solutions).toContainText("Tu solución");

  // Sin haberlo superado, la solución de referencia pide confirmación.
  const reveal = solutions.locator("[data-solution-action='reveal']");
  await reveal.click();
  await expect(reveal).toContainText("¿seguro?");
  await expect(solutions.locator(".project-solutions__reference")).toBeHidden();
  await reveal.click();
  await expect(solutions.locator(".project-solutions__code")).toContainText("def salir_con_error");

  // Tu código se descarga con el nombre del programa.
  await setCode(page, "print('mi versión')\n");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    solutions.locator("[data-solution-action='download']").click(),
  ]);
  expect(download.suggestedFilename()).toBe("tareas.py");
  await expect(page.locator(".project-steps__step--current")).toContainText("escribe tu programa");

  // Sin argumentos, pero con disco que se conserva: solo el botón de vaciarlo.
  await page.goto("/#p-control-de-gastos");
  await expect(page.locator("[data-action='clear-disk']")).toBeVisible();
  await expect(page.locator("#exercise-args-input")).toBeHidden();
  await expect(page.locator("#exercise-output")).toContainText("se conservan entre ejecuciones");
  // Ni argumentos ni disco: la fila no aparece, como en las lecciones.
  await page.goto("/#p-adivina-el-numero");
  await expect(page.locator("#exercise-args")).toBeHidden();
  await page.goto("/#l-hola-mundo");
  await expect(page.locator("#exercise-args")).toBeHidden();
  await expect(page.locator("#project-tabs")).toBeHidden();
  await expect(page.locator("#exercise-file")).toHaveText("ejercicio.py");
});

test("los programas de línea de comandos reciben argumentos y conservan el disco", async ({
  page,
}) => {
  await openApp(page, "#p-gestor-de-tareas");
  await page.evaluate(() => {
    const { course } = window.__desdecero;
    document
      .querySelector("#exercise-editor .CodeMirror")
      .CodeMirror.setValue(course.getProject("gestor-de-tareas").solution);
  });
  const args = page.locator("#exercise-args-input");
  const output = page.locator("#exercise-output");

  await args.fill('agregar "Comprar pan"');
  await args.press("Enter");
  await expect(output).toContainText('$ python tareas.py agregar "Comprar pan"');
  await expect(output).toContainText("Tarea agregada (id: 1)");
  await expect(output).toContainText("# archivo guardado: tareas.json");

  await args.fill("listar");
  await page.locator("#view-lesson [data-action='run']").click();
  await expect(output).toContainText("[ ] 1 · Comprar pan");
  // Solo se enseñan los archivos que guardó esta ejecución.
  await expect(output).not.toContainText("# archivo guardado");

  await args.fill("eliminar 9");
  await args.press("Enter");
  await expect(output).toContainText("Error: No existe la tarea 9");
  await expect(output).toContainText("código de salida 1");

  await page.locator("[data-action='clear-disk']").click();
  await expect(output).toContainText("disco vaciado");
  await args.fill("listar");
  await args.press("Enter");
  await expect(output).toContainText("No hay tareas.");

  // Superar el proyecto lo marca como completado en el catálogo.
  await page.locator("#view-lesson [data-action='check']").click();
  await expect(output).toContainText("¡Proyecto superado!");
  await expect(page.locator("#exercise-success")).toContainText("proyecto superado");
  await expect(page.locator(".project-steps__step--done")).toHaveCount(3);
  await page.goto("/#proyectos");
  await expect(page.locator("#projects-progress")).toContainText("1/");
  await expect(page.locator(".project-card--done")).toContainText("Gestor de tareas");
});

test("sys.exit(), sys.stderr y las comprobaciones con argumentos, before y persist", async ({
  page,
}) => {
  await openApp(page);
  const program = `import sys
print("argumentos:", sys.argv)
if len(sys.argv) > 1 and sys.argv[1] == "falla":
    print("algo salió mal", file=sys.stderr)
    sys.exit(2)
with open("veces.txt", "a") as f:
    f.write("x")
with open("veces.txt") as f:
    print("veces:", len(f.read()))
print("secreto:", SECRETO)
`;
  const passed = await check(
    page,
    program,
    {
      persist: true,
      runs: [
        { args: ["uno"], before: "SECRETO = 1", contains: ["veces: 1", "secreto: 1"] },
        { args: ["falla"], before: "SECRETO = 2", contains: ["algo salió mal"] },
        {
          args: ["dos tres"],
          before: "SECRETO = 3",
          output: "argumentos: ['tareas.py', 'dos tres']\nveces: 2\nsecreto: 3",
        },
      ],
    },
    { file: "tareas.py" },
  );
  expect(passed.passed, passed.log).toBe(true);
  expect(passed.log).toContain('prueba 3/3 · python tareas.py "dos tres"');
  // La salida de errores se ve, pero no cuenta como salida del programa.
  expect(passed.log).toContain("algo salió mal");

  // Las líneas de los errores no cuentan las de «before».
  const error = await check(page, "x = 1\nprint(y)\n", {
    runs: [{ before: "import random\nrandom.seed(1)" }],
  });
  expect(error.log).toContain("NameError en la línea 2");

  // Si el programa termina con sys.exit() antes de las comprobaciones, se explica.
  const exited = await check(page, "import sys\nsys.exit()\n", {}, { test: "assert False" });
  expect(exited.reason).toBe("exited");
  expect(exited.log).toContain("terminó con sys.exit() antes de llegar a las comprobaciones");
});
