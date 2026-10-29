/*
 * Módulos de la biblioteca estándar que Skulpt no trae, escritos en Python
 * (src/python/): abc, dataclasses y typing. Están disponibles en todas las
 * rutas, en el playground y en los ejemplos.
 */

import abcSource from "../../python/abc.py";
import dataclassesSource from "../../python/dataclasses.py";
import typingSource from "../../python/typing.py";
import { registerPythonFiles } from "./engine.js";

/** Registra los módulos. Se llama una vez al arrancar. */
export function installStandardLibraryExtras() {
  registerPythonFiles({
    "src/lib/abc.py": abcSource,
    "src/lib/dataclasses.py": dataclassesSource,
    "src/lib/typing.py": typingSource,
  });
}
