import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  importedModules,
  modulesToPreload,
  neededPackages,
  translateStatus,
  usesPlots,
} from "../../src/js/pyodide/detect.js";

const ALLOWED = ["numpy", "pandas", "matplotlib"];

describe("qué programas necesitan Python completo (Pyodide)", () => {
  test("lee los módulos que importa el programa", () => {
    const code = [
      "import pandas as pd",
      "import os, sys",
      "from matplotlib import pyplot as plt",
      "    import numpy.linalg",
      "# import flet",
      'texto = "import requests"',
    ].join("\n");
    assert.deepEqual([...importedModules(code)].sort(), [
      "matplotlib",
      "numpy",
      "os",
      "pandas",
      "sys",
    ]);
  });

  test("elige los paquetes permitidos, y matplotlib si pandas dibuja", () => {
    assert.deepEqual(neededPackages("import pandas as pd\nprint(1)", ALLOWED), ["pandas"]);
    assert.deepEqual(neededPackages("import pandas as pd\ndf.plot(x='mes')", ALLOWED), [
      "pandas",
      "matplotlib",
    ]);
    assert.deepEqual(neededPackages("import scipy\nimport flet as ft", ALLOWED), []);
    assert.deepEqual(neededPackages("print('pandas')", ALLOWED), []);
  });

  test("importa por adelantado los módulos pesados que va a usar", () => {
    assert.deepEqual(modulesToPreload(["pandas"], "import pandas"), ["pandas"]);
    assert.deepEqual(
      modulesToPreload(["numpy", "pandas", "matplotlib"], "import matplotlib.pyplot as plt"),
      ["numpy", "pandas", "matplotlib.pyplot"],
    );
    assert.ok(usesPlots("ventas.hist(bins=10)"));
    assert.ok(!usesPlots("print(ventas.describe())"));
  });

  test("traduce los mensajes de carga, solo con los paquetes del curso", () => {
    assert.equal(
      translateStatus("Loading Pillow, matplotlib, numpy, pandas, six", ALLOWED),
      "# cargando matplotlib, numpy y pandas…",
    );
    assert.equal(translateStatus("Loading numpy", ALLOWED), "# cargando numpy…");
    assert.equal(translateStatus("Loaded numpy, pandas", ALLOWED), null);
    assert.equal(translateStatus("Loading six", ALLOWED), null);
  });
});
