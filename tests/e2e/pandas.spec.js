/*
 * Python completo con Pyodide: los programas con pandas, numpy o matplotlib
 * corren con las librerías de verdad en un Web Worker.
 *
 * Cada prueba abre una página nueva, así que carga Pyodide de nuevo (desde
 * .cache/pyodide, ver scripts/download-pyodide.js): por eso tienen más tiempo.
 */

import { expect, openApp, test } from "./fixtures.js";

test.describe.configure({ timeout: 120_000 });

const LOAD = { timeout: 90_000 };

/** Pone código en el editor del playground y lo ejecuta. */
async function runInPlayground(page, code) {
  await page.evaluate((source) => {
    document.querySelector("#playground-editor .CodeMirror").CodeMirror.setValue(source);
  }, code);
  await page.locator("#view-playground [data-action='run']").click();
}

/** Ejecuta código con las comprobaciones de un ejercicio y devuelve el informe. */
async function check(page, code, { testCode = "", runs } = {}) {
  return page.evaluate(
    async ({ code, testCode, runs }) => {
      const { checkExercise, createTerminal } = window.__desdecero;
      const output = document.createElement("pre");
      const result = await checkExercise(
        { checks: runs ? { runs } : {}, test: testCode },
        code,
        createTerminal(output),
      );
      return { ...result, log: output.textContent, images: output.querySelectorAll("img").length };
    },
    { code, testCode, runs },
  );
}

test("pandas y numpy de verdad: la salida, los tipos y los errores son los de Python", async ({
  page,
}) => {
  await openApp(page);
  const program = `import numpy as np
import pandas as pd

ventas = pd.DataFrame({
    "ciudad": ["Bogotá", "Cali", "Bogotá", "Medellín", None],
    "unidades": [3, 5, 2, 7, 1],
    "precio": [9500, 4200.5, 9500, 12000, 3000],
})
ventas["total"] = ventas["unidades"] * ventas["precio"]
print(ventas)
print(ventas.dtypes)
print(ventas.groupby("ciudad")["total"].sum())
print(np.round(ventas["precio"].mean(), 2))
ventas.to_csv("ventas.csv", index=False)
print(pd.read_csv("ventas.csv").shape)
`;
  const result = await check(page, program, {
    runs: [
      {
        // La misma salida que con Python 3.13 y pandas 3.0.2 en un ordenador.
        output: `     ciudad  unidades   precio    total
0    Bogotá         3   9500.0  28500.0
1      Cali         5   4200.5  21002.5
2    Bogotá         2   9500.0  19000.0
3  Medellín         7  12000.0  84000.0
4       NaN         1   3000.0   3000.0
ciudad          str
unidades      int64
precio      float64
total       float64
dtype: object
ciudad
Bogotá      47500.0
Cali        21002.5
Medellín    84000.0
Name: total, dtype: float64
7640.1
(5, 4)`,
      },
    ],
  });
  expect(result.passed, result.log).toBe(true);
  expect(result.log).toContain("# cargando numpy y pandas…");

  // Los errores se explican con la línea del alumno, también los que salen de dentro de pandas.
  const missing = await check(
    page,
    `import pandas as pd
df = pd.DataFrame({"precio": [1, 2]})
print(df["Precio"])`,
  );
  expect(missing.log).toContain("KeyError en la línea 3");
  expect(missing.log).toContain("Esa columna (o esa etiqueta de fila) no existe");

  const ambiguous = await check(
    page,
    `import pandas as pd
df = pd.DataFrame({"a": [1, 2], "b": [3, 4]})

print(df[df["a"] > 1 and df["b"] < 4])`,
  );
  expect(ambiguous.log).toContain("ValueError en la línea 4");
  expect(ambiguous.log).toContain("usa & (y), | (o) y ~ (no)");

  const file = await check(page, `import pandas as pd\npd.read_csv("no-existe.csv")`);
  expect(file.log).toContain("FileNotFoundError en la línea 2");
  expect(file.log).toContain("Ese archivo no existe");

  // test.py funciona igual que con Skulpt: sus asserts y los nombres del alumno.
  const tested = await check(page, `import pandas as pd\ndf = pd.DataFrame({"x": [1, 2, 3]})`, {
    testCode: `assert df["x"].sum() == 7, "La suma de x debería ser 7"`,
  });
  expect(tested.passed).toBe(false);
  expect(tested.log).toContain("✗ La suma de x debería ser 7");
});

test("los gráficos de matplotlib aparecen en la salida al llamar a plt.show()", async ({
  page,
}) => {
  await openApp(page, "#playground");
  await runInPlayground(
    page,
    `import matplotlib.pyplot as plt
import pandas as pd

datos = pd.DataFrame({"mes": ["ene", "feb", "mar"], "ventas": [120, 95, 140]})
print("antes")
datos.plot.bar(x="mes", y="ventas", title="Ventas por mes")
plt.show()
print("después")
plt.plot([1, 2, 3])
plt.savefig("linea.png")
`,
  );
  const output = page.locator("#playground-output");
  await expect(output).toContainText("[terminado en", LOAD);
  await expect(output.locator("img.console__figure")).toHaveCount(2);
  await expect(output).toContainText("# imagen guardada: linea.png");
  // El gráfico va entre lo que se imprimió antes y después de plt.show().
  const order = await output.evaluate((element) =>
    [...element.childNodes]
      .map((node) => (node.tagName === "IMG" ? "[gráfico]" : node.textContent))
      .join(""),
  );
  expect(order).toMatch(/antes\n\[gráfico\]después/);
  // La segunda figura se guardó con savefig() pero no se enseñó: se avisa.
  await expect(output).toContainText("no se ve hasta que llamas a plt.show()");
  const size = await output
    .locator("img.console__figure")
    .first()
    .evaluate((image) => [image.naturalWidth, image.naturalHeight]);
  // 6,4 × 4,8 pulgadas a 144 puntos por pulgada, como savefig(dpi=144) en un ordenador.
  expect(size).toEqual([921, 691]);
});

test("detener y el límite de tiempo cortan un programa de Pyodide, que vuelve a cargar", async ({
  page,
}) => {
  await openApp(page, "#playground");
  await runInPlayground(page, `import numpy as np\nprint(np.arange(3))\nwhile True:\n    pass\n`);
  const output = page.locator("#playground-output");
  await expect(output).toContainText("[0 1 2]", LOAD);
  await page.locator("#view-playground [data-action='stop']").click();
  await expect(output).toContainText("programa detenido");

  await runInPlayground(page, `import numpy as np\nprint(np.ones(2).sum())\n`);
  await expect(output).toContainText("# reiniciando Python…");
  await expect(output).toContainText("2.0", LOAD);

  const limit = await check(page, `import numpy as np\nwhile True:\n    np.zeros(3)\n`);
  expect(limit.log).toContain("TimeLimitError");

  // input() no está disponible con Python completo: se explica.
  await runInPlayground(page, `import pandas as pd\nnombre = input("¿Nombre? ")\n`);
  await expect(output).toContainText("input() no funciona en los programas que usan pandas", LOAD);
});
