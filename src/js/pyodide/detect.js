/*
 * Qué programas necesitan Python completo (Pyodide) y qué paquetes cargar.
 * Sin dependencias del navegador: se prueba en tests/unit.
 */

const IMPORT = /^[ \t]*(?:import[ \t]+([\w., \t]+)|from[ \t]+([\w.]+)[ \t]+import\b)/gm;

/** Los módulos de primer nivel que importa el programa: "import pandas as pd" → pandas. */
export function importedModules(code) {
  const modules = new Set();
  for (const match of code.matchAll(IMPORT)) {
    const names = match[1]
      ? match[1].split(",").map((part) => part.trim().split(/[ \t]+/)[0])
      : [match[2]];
    for (const name of names) if (name) modules.add(name.split(".")[0]);
  }
  return modules;
}

/**
 * Los paquetes de Pyodide que necesita el programa, de los permitidos.
 * Dibujar con pandas (df.plot(), df.hist()) también necesita matplotlib.
 * @param {string} code
 * @param {string[]} allowed
 */
export function neededPackages(code, allowed) {
  const imported = importedModules(code);
  const packages = allowed.filter((name) => imported.has(name));
  if (packages.length && !packages.includes("matplotlib") && usesPlots(code)) {
    packages.push("matplotlib");
  }
  return packages;
}

/** true si el programa importa alguno de los paquetes de Python completo. */
export const usesFullPython = (code, allowed) => neededPackages(code, allowed).length > 0;

/** Si el programa dibuja gráficos: con matplotlib o con los métodos de pandas. */
export const usesPlots = (code) =>
  /\bmatplotlib\b|\.plot\b|\.hist\(|\.boxplot\(|\.scatter\(/.test(code);

/**
 * Los módulos que conviene importar antes de empezar a contar el tiempo:
 * importar pandas o matplotlib la primera vez tarda varios segundos.
 */
export function modulesToPreload(packages, code) {
  const modules = [];
  if (packages.includes("numpy")) modules.push("numpy");
  if (packages.includes("pandas")) modules.push("pandas");
  if (packages.includes("matplotlib") && usesPlots(code)) modules.push("matplotlib.pyplot");
  return modules;
}

/**
 * «Loading Pillow, numpy, pandas, ...» → «# cargando numpy y pandas…»: solo
 * los paquetes del curso (packages), sin sus dependencias. «Loaded ...» no se enseña.
 */
export function translateStatus(text, packages) {
  const loading = text.match(/^Loading (.+)$/);
  if (!loading) return null;
  const names = loading[1].split(/,\s*/).filter((name) => packages.includes(name));
  if (!names.length) return null;
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} y ${names.at(-1)}` : names[0];
  return `# cargando ${list}…`;
}
