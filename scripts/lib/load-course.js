/*
 * Lee el curso desde content/ y comprueba que esté completo.
 *
 *   content/NN-modulo/module.json
 *   content/NN-modulo/NN-leccion/lesson.md
 *                               /starter.py
 *                               /solution.py
 *                               /checks.json
 *                               /test.py      (opcional)
 *
 * Cualquier problema se acumula y se informa de una vez, con la ruta del
 * archivo, para que sea fácil de corregir.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const NUMBERED_DIR = /^(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const LESSON_SECTIONS = { Ejercicio: "exercise", Pista: "hint" };
const CHECK_KEYS = new Set(["requires", "forbids", "ignore", "runs"]);
const RUN_KEYS = new Set(["inputs", "output", "contains", "test"]);

export class CourseError extends Error {
  constructor(problems) {
    super(
      `El contenido del curso tiene ${problems.length} problema(s):\n- ${problems.join("\n- ")}`,
    );
    this.problems = problems;
  }
}

/** Devuelve { modules: [...] } listo para incrustar en la página. */
export function loadCourse(contentDir) {
  const problems = [];
  const seenIds = new Map();

  const modules = numberedDirs(contentDir, problems).map(({ dir, slug }) => {
    const meta = readJson(path.join(dir, "module.json"), problems) ?? {};
    requireStrings(meta, ["title", "description"], path.join(dir, "module.json"), problems);

    const lessons = numberedDirs(dir, problems).map(({ dir: lessonDir, slug: id }) => {
      if (seenIds.has(id)) {
        problems.push(`${rel(lessonDir)}: el id "${id}" ya se usa en ${rel(seenIds.get(id))}`);
      }
      seenIds.set(id, lessonDir);
      return loadLesson(lessonDir, id, problems);
    });

    if (!lessons.length) problems.push(`${rel(dir)}: el módulo no tiene lecciones`);
    return { id: slug, title: meta.title, description: meta.description, lessons };
  });

  if (!modules.length) problems.push(`${rel(contentDir)}: no hay módulos`);
  if (problems.length) throw new CourseError(problems);
  return { modules };
}

function loadLesson(dir, id, problems) {
  const file = (name) => path.join(dir, name);
  const markdown = readText(file("lesson.md"), problems) ?? "";
  const { meta, body } = splitFrontmatter(markdown, file("lesson.md"), problems);
  const sections = splitSections(body, file("lesson.md"), problems);

  requireStrings(meta, ["title", "summary"], file("lesson.md"), problems);
  if (!Number.isInteger(meta.minutes) || meta.minutes <= 0) {
    problems.push(`${rel(file("lesson.md"))}: "minutes" debe ser un número entero positivo`);
  }

  const checks = readJson(file("checks.json"), problems) ?? {};
  validateChecks(checks, file("checks.json"), problems);

  return {
    id,
    title: meta.title,
    minutes: meta.minutes,
    summary: meta.summary,
    theory: sections.theory,
    exercise: sections.exercise,
    hint: sections.hint,
    starter: readText(file("starter.py"), problems) ?? "",
    solution: readText(file("solution.py"), problems) ?? "",
    test: existsSync(file("test.py")) ? readText(file("test.py"), problems).trimEnd() : "",
    checks,
  };
}

/** Separa el bloque YAML inicial (entre líneas ---) del resto del Markdown. */
function splitFrontmatter(markdown, file, problems) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    problems.push(`${rel(file)}: falta el bloque de metadatos entre líneas ---`);
    return { meta: {}, body: markdown };
  }
  try {
    return { meta: parseYaml(match[1]) ?? {}, body: match[2] };
  } catch (error) {
    problems.push(`${rel(file)}: metadatos YAML inválidos (${error.message.split("\n")[0]})`);
    return { meta: {}, body: match[2] };
  }
}

/** Divide el cuerpo en teoría (antes del primer ##), ## Ejercicio y ## Pista. */
function splitSections(body, file, problems) {
  const sections = { theory: "", exercise: "", hint: "" };
  let current = "theory";
  const buffer = { theory: [], exercise: [], hint: [] };

  for (const line of body.split("\n")) {
    const heading = line.match(/^## (.+)$/);
    if (heading) {
      current = LESSON_SECTIONS[heading[1].trim()];
      if (!current) problems.push(`${rel(file)}: sección desconocida "## ${heading[1]}"`);
      continue;
    }
    if (current) buffer[current].push(line);
  }
  for (const key of Object.keys(sections)) {
    sections[key] = buffer[key].join("\n").trim();
    if (!sections[key])
      problems.push(`${rel(file)}: falta contenido en la sección "${sectionName(key)}"`);
  }
  return sections;
}

function validateChecks(checks, file, problems) {
  const where = rel(file);
  for (const key of Object.keys(checks)) {
    if (!CHECK_KEYS.has(key)) problems.push(`${where}: clave desconocida "${key}"`);
  }
  for (const key of ["requires", "forbids"]) {
    for (const rule of checks[key] ?? []) {
      if (typeof rule.pattern !== "string" || typeof rule.message !== "string") {
        problems.push(`${where}: cada regla de "${key}" necesita "pattern" y "message"`);
      } else if (!isValidRegExp(rule.pattern)) {
        problems.push(`${where}: expresión regular inválida en "${key}": ${rule.pattern}`);
      }
    }
  }
  if (checks.ignore !== undefined && !isValidRegExp(checks.ignore)) {
    problems.push(`${where}: expresión regular inválida en "ignore"`);
  }
  for (const [index, run] of (checks.runs ?? []).entries()) {
    for (const key of Object.keys(run)) {
      if (!RUN_KEYS.has(key))
        problems.push(`${where}: runs[${index}] tiene una clave desconocida "${key}"`);
    }
    if (run.inputs && !run.inputs.every((value) => typeof value === "string")) {
      problems.push(`${where}: runs[${index}].inputs debe ser una lista de textos`);
    }
  }
}

/* ---- Lectura de archivos ---- */

function numberedDirs(parent, problems) {
  return readdirSync(parent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const match = entry.name.match(NUMBERED_DIR);
      if (!match) {
        problems.push(
          `${rel(path.join(parent, entry.name))}: el nombre debe ser NN-nombre-en-minusculas`,
        );
        return null;
      }
      return { dir: path.join(parent, entry.name), order: Number(match[1]), slug: match[2] };
    })
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
}

function readText(file, problems) {
  if (!existsSync(file)) {
    problems.push(`${rel(file)}: falta el archivo`);
    return null;
  }
  return readFileSync(file, "utf8");
}

function readJson(file, problems) {
  const text = readText(file, problems);
  if (text == null) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    problems.push(`${rel(file)}: JSON inválido (${error.message})`);
    return null;
  }
}

function requireStrings(object, keys, file, problems) {
  for (const key of keys) {
    if (typeof object[key] !== "string" || !object[key].trim()) {
      problems.push(`${rel(file)}: falta "${key}"`);
    }
  }
}

function isValidRegExp(pattern) {
  try {
    new RegExp(pattern);
    return true;
  } catch {
    return false;
  }
}

const sectionName = (key) =>
  ({ theory: "teoría", exercise: "## Ejercicio", hint: "## Pista" })[key];

const rel = (file) => path.relative(process.cwd(), file) || ".";
