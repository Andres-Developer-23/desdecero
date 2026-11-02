/*
 * Lee el curso desde content/ y comprueba que esté completo.
 *
 *   content/web/<sitio>.example/...            web de prácticas del simulador web (opcional)
 *   content/api/<api>.example.json             datos de las APIs de práctica (opcional)
 *   content/db/<base>.sql                      bases de datos de práctica de sqlite3 (opcional)
 *   content/data/<archivo>.csv                 datos de práctica de pandas (opcional)
 *   content/NN-ruta/route.json                 título, descripción, nivel y motor
 *   content/NN-ruta/NN-modulo/module.json      título y descripción del módulo
 *   content/NN-ruta/NN-modulo/NN-leccion/
 *     lesson.md      metadatos, teoría, ## Ejercicio y ## Pista
 *     starter.py     código con el que empieza el editor
 *     solution.py    solución de referencia
 *     checks.json    cómo se comprueba el ejercicio
 *     test.py        asserts extra (opcional)
 *   content/proyectos/NN-proyecto/
 *     proyecto.md    metadatos, detalle, ## Objetivo, ## Pista y ## Solución
 *     starter.py, solution.py, checks.json y test.py, como en las lecciones
 *
 * Cualquier problema se acumula y se informa de una vez, con la ruta del
 * archivo, para que sea fácil de corregir.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const NUMBERED_DIR = /^(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)$/;
const LESSON_SECTIONS = { Ejercicio: "exercise", Pista: "hint" };
const PROJECT_SECTIONS = { Objetivo: "exercise", Pista: "hint", Solución: "explanation" };
const CHECK_KEYS = new Set(["requires", "forbids", "ignore", "runs", "persist"]);
const RUN_KEYS = new Set(["inputs", "output", "contains", "test", "args", "before"]);
/** Niveles de los proyectos, de más fácil a más difícil. */
export const LEVELS = ["principiante", "intermedio", "avanzado"];
/** Nombre del programa de un proyecto: tareas.py, gastos.py... */
const PROGRAM_FILE = /^[a-z0-9_]+\.py$/;
/** Motores con los que se ejecutan los ejercicios de una ruta. */
export const RUNTIMES = new Set(["python", "flet", "web", "sqlite", "pandas"]);
/** Tipos de archivo de la web de prácticas, por extensión. */
const WEB_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};
/** Los sitios de práctica usan el dominio reservado .example: nunca apuntan a una web real. */
const WEB_HOST = /^[a-z0-9]+(?:-[a-z0-9]+)*\.example$/;
const API_FILE = /^(api\.[a-z0-9]+(?:-[a-z0-9]+)*\.example)\.json$/;
const DB_FILE = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.sql$/;
const DATA_FILE = /^[a-z0-9]+(?:[-_][a-z0-9]+)*\.(?:csv|txt|json)$/;

export class CourseError extends Error {
  constructor(problems) {
    super(
      `El contenido del curso tiene ${problems.length} problema(s):\n- ${problems.join("\n- ")}`,
    );
    this.problems = problems;
  }
}

/** Devuelve { routes, projects, web, apis, databases, data } listo para incrustar en la página. */
export function loadCourse(contentDir) {
  const problems = [];
  const seenLessonIds = new Map();

  const routes = numberedDirs(contentDir, problems, {
    ignore: ["web", "api", "db", "data", "proyectos"],
  }).map(({ dir, slug }) => loadRoute(dir, slug, { problems, seenLessonIds }));
  const projectsDir = path.join(contentDir, "proyectos");
  // Los proyectos comparten los identificadores con las lecciones: los dos se guardan en el progreso.
  const projects = existsSync(projectsDir)
    ? numberedDirs(projectsDir, problems).map(({ dir, slug }) => {
        if (seenLessonIds.has(slug)) {
          problems.push(
            `${rel(dir)}: el id "${slug}" ya se usa en ${rel(seenLessonIds.get(slug))}`,
          );
        }
        seenLessonIds.set(slug, dir);
        return { ...loadProject(dir, slug, problems), dir };
      })
    : [];
  const webDir = path.join(contentDir, "web");
  const web = existsSync(webDir) ? loadWeb(webDir, problems) : {};
  const apiDir = path.join(contentDir, "api");
  const apis = existsSync(apiDir) ? loadApis(apiDir, problems) : {};
  const dbDir = path.join(contentDir, "db");
  const databases = existsSync(dbDir) ? loadDatabases(dbDir, problems) : {};
  const dataDir = path.join(contentDir, "data");
  const data = existsSync(dataDir) ? loadDataFiles(dataDir, problems) : {};

  if (!routes.length) problems.push(`${rel(contentDir)}: no hay rutas`);
  const routeIds = new Set(routes.map((route) => route.id));
  for (const route of routes) {
    if (route.requires && !routeIds.has(route.requires)) {
      problems.push(`${rel(route.dir)}/route.json: "requires" apunta a una ruta que no existe`);
    }
  }

  // La página inicial de la pestaña «web» de una lección tiene que existir (o ser de una API
  // o del servidor de Flask del alumno, http://127.0.0.1:5000).
  const checkReferences = (item, file) => {
    const page = item.web?.endsWith("/") ? `${item.web}index.html` : item.web;
    const known = web[page] || apiHost(item.web) in apis || isLocalServer(item.web);
    if (item.web != null && !known) {
      problems.push(
        `${rel(item.dir)}/${file}: "web" apunta a una página que no existe: ${item.web}`,
      );
    }
    if (item.db != null && !(item.db in databases)) {
      problems.push(
        `${rel(item.dir)}/${file}: "db" apunta a una base de práctica que no existe: ${item.db}`,
      );
    }
    delete item.dir;
  };
  for (const route of routes) {
    for (const lesson of route.modules.flatMap((module) => module.lessons)) {
      checkReferences(lesson, "lesson.md");
    }
    delete route.dir;
  }
  for (const project of projects) {
    if (project.requires && !routeIds.has(project.requires)) {
      problems.push(`${rel(project.dir)}/proyecto.md: "requires" apunta a una ruta que no existe`);
    }
    checkReferences(project, "proyecto.md");
  }

  if (problems.length) throw new CourseError(problems);
  return { routes, projects, web, apis, databases, data };
}

function isLocalServer(url) {
  try {
    return /^http:\/\/(127\.0\.0\.1|localhost):5000\//.test(new URL(url).href);
  } catch {
    return false;
  }
}

function apiHost(url) {
  try {
    return new URL(url).protocol === "https:" ? new URL(url).host : null;
  } catch {
    return null;
  }
}

function loadRoute(dir, id, context) {
  const { problems } = context;
  const file = path.join(dir, "route.json");
  const meta = readJson(file, problems) ?? {};
  requireStrings(meta, ["title", "description", "level"], file, problems);
  if (!RUNTIMES.has(meta.runtime)) {
    problems.push(`${rel(file)}: "runtime" debe ser uno de: ${[...RUNTIMES].join(", ")}`);
  }

  const modules = numberedDirs(dir, problems).map(({ dir: moduleDir, slug }) =>
    loadModule(moduleDir, slug, context),
  );
  if (!modules.length) problems.push(`${rel(dir)}: la ruta no tiene módulos`);

  return {
    id,
    dir,
    title: meta.title,
    description: meta.description,
    level: meta.level,
    runtime: meta.runtime,
    requires: meta.requires ?? null,
    modules,
  };
}

/**
 * Lee la web de prácticas: content/web/libreria.example/catalogo/pagina-2.html
 * se sirve en https://libreria.example/catalogo/pagina-2.html. Cada index.html
 * responde también en la URL de su carpeta (eso lo resuelve src/js/web/virtual-web.js).
 */
function loadWeb(dir, problems) {
  const pages = {};
  for (const host of readdirSync(dir, { withFileTypes: true })) {
    const hostDir = path.join(dir, host.name);
    if (!host.isDirectory() || !WEB_HOST.test(host.name)) {
      problems.push(`${rel(hostDir)}: cada sitio es una carpeta con un dominio .example`);
      continue;
    }
    for (const file of listFiles(hostDir)) {
      const type = WEB_TYPES[path.extname(file)];
      if (!type) {
        problems.push(`${rel(file)}: tipo de archivo no admitido en la web de prácticas`);
        continue;
      }
      const urlPath = path.relative(hostDir, file).split(path.sep).join("/");
      pages[`https://${host.name}/${urlPath}`] = { type, body: readFileSync(file, "utf8") };
    }
  }
  return pages;
}

/**
 * Lee los datos de las APIs de práctica: content/api/api.libreria.example.json
 * son los datos de https://api.libreria.example (la API está en src/js/web/apis/).
 */
function loadApis(dir, problems) {
  const apis = {};
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    const host = entry.isFile() ? entry.name.match(API_FILE)?.[1] : null;
    if (!host) {
      problems.push(`${rel(file)}: cada API es un archivo api.<nombre>.example.json`);
      continue;
    }
    const data = readJson(file, problems);
    if (data) apis[host] = data;
  }
  return apis;
}

/**
 * Lee las bases de datos de práctica: content/db/libreria.sql es el script
 * que crea libreria.db cada vez que un programa la abre.
 */
function loadDatabases(dir, problems) {
  const databases = {};
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    const name = entry.isFile() ? entry.name.match(DB_FILE)?.[1] : null;
    if (!name) {
      problems.push(`${rel(file)}: cada base de práctica es un archivo <nombre>.sql`);
      continue;
    }
    databases[`${name}.db`] = readFileSync(file, "utf8");
  }
  return databases;
}

/**
 * Lee los datos de práctica: cada archivo de content/data/ está en la carpeta
 * de trabajo de los programas con pandas (pd.read_csv("ventas.csv")).
 */
function loadDataFiles(dir, problems) {
  const files = {};
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (!entry.isFile() || !DATA_FILE.test(entry.name)) {
      problems.push(
        `${rel(file)}: cada archivo de datos es un .csv, .txt o .json con nombre en minúsculas`,
      );
      continue;
    }
    files[entry.name] = readFileSync(file, "utf8");
  }
  return files;
}

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

function loadModule(dir, id, { problems, seenLessonIds }) {
  const meta = readJson(path.join(dir, "module.json"), problems) ?? {};
  requireStrings(meta, ["title", "description"], path.join(dir, "module.json"), problems);

  const lessons = numberedDirs(dir, problems).map(({ dir: lessonDir, slug: lessonId }) => {
    if (seenLessonIds.has(lessonId)) {
      problems.push(
        `${rel(lessonDir)}: el id "${lessonId}" ya se usa en ${rel(seenLessonIds.get(lessonId))}`,
      );
    }
    seenLessonIds.set(lessonId, lessonDir);
    return { ...loadLesson(lessonDir, lessonId, problems), dir: lessonDir };
  });

  if (!lessons.length) problems.push(`${rel(dir)}: el módulo no tiene lecciones`);
  return { id, title: meta.title, description: meta.description, lessons };
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
  if (meta.db !== undefined && typeof meta.db !== "string") {
    problems.push(`${rel(file("lesson.md"))}: "db" debe ser el nombre de una base de práctica`);
  }
  if (meta.web !== undefined && typeof meta.web !== "string") {
    problems.push(`${rel(file("lesson.md"))}: "web" debe ser la URL de una página de prácticas`);
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
    web: meta.web ?? null,
    db: meta.db ?? null,
  };
}

/**
 * Un proyecto: como una lección, pero con nivel, etiquetas, el motor con el
 * que se ejecuta, la explicación de la solución y, si es un programa de
 * línea de comandos (cli: true), argumentos y un disco que se conserva.
 */
function loadProject(dir, id, problems) {
  const file = (name) => path.join(dir, name);
  const where = rel(file("proyecto.md"));
  const markdown = readText(file("proyecto.md"), problems) ?? "";
  const { meta, body } = splitFrontmatter(markdown, file("proyecto.md"), problems);
  const sections = splitSections(body, file("proyecto.md"), problems, PROJECT_SECTIONS);

  requireStrings(meta, ["title", "summary"], file("proyecto.md"), problems);
  if (!Number.isInteger(meta.minutes) || meta.minutes <= 0) {
    problems.push(`${where}: "minutes" debe ser un número entero positivo`);
  }
  if (!LEVELS.includes(meta.level)) {
    problems.push(`${where}: "level" debe ser uno de: ${LEVELS.join(", ")}`);
  }
  const tags = Array.isArray(meta.tags) ? meta.tags : [];
  if (!tags.length || !tags.every((tag) => typeof tag === "string" && tag.trim())) {
    problems.push(`${where}: "tags" debe ser una lista de etiquetas, como [CLI, Archivos]`);
  }
  if (!RUNTIMES.has(meta.runtime)) {
    problems.push(`${where}: "runtime" debe ser uno de: ${[...RUNTIMES].join(", ")}`);
  }
  if (meta.file !== undefined && !PROGRAM_FILE.test(String(meta.file))) {
    problems.push(`${where}: "file" debe ser el nombre del programa, como tareas.py`);
  }
  if (meta.cli !== undefined && typeof meta.cli !== "boolean") {
    problems.push(`${where}: "cli" debe ser true o false`);
  }
  for (const key of ["web", "db", "requires"]) {
    if (meta[key] !== undefined && typeof meta[key] !== "string") {
      problems.push(`${where}: "${key}" debe ser un texto`);
    }
  }

  const checks = readJson(file("checks.json"), problems) ?? {};
  validateChecks(checks, file("checks.json"), problems);

  return {
    id,
    title: meta.title,
    level: meta.level,
    tags,
    minutes: meta.minutes,
    runtime: meta.runtime,
    requires: meta.requires ?? null,
    summary: meta.summary,
    file: meta.file ?? "proyecto.py",
    cli: meta.cli ?? false,
    theory: sections.theory,
    exercise: sections.exercise,
    hint: sections.hint,
    explanation: sections.explanation,
    starter: readText(file("starter.py"), problems) ?? "",
    solution: readText(file("solution.py"), problems) ?? "",
    test: existsSync(file("test.py")) ? readText(file("test.py"), problems).trimEnd() : "",
    checks,
    web: meta.web ?? null,
    db: meta.db ?? null,
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

/**
 * Divide el cuerpo en teoría (antes del primer ##) y las secciones con su
 * título (## Ejercicio y ## Pista en las lecciones). Todas son obligatorias.
 */
function splitSections(body, file, problems, names = LESSON_SECTIONS) {
  const buffer = { theory: [] };
  for (const key of Object.values(names)) buffer[key] = [];
  let current = "theory";

  for (const line of body.split("\n")) {
    const heading = line.match(/^## (.+)$/);
    if (heading) {
      current = names[heading[1].trim()];
      if (!current) problems.push(`${rel(file)}: sección desconocida "## ${heading[1]}"`);
      continue;
    }
    if (current) buffer[current].push(line);
  }
  const sections = {};
  for (const key of Object.keys(buffer)) {
    sections[key] = buffer[key].join("\n").trim();
    if (!sections[key]) {
      const title = Object.keys(names).find((name) => names[name] === key);
      problems.push(
        `${rel(file)}: falta contenido en la sección "${title ? `## ${title}` : "teoría"}"`,
      );
    }
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
  if (checks.persist !== undefined && typeof checks.persist !== "boolean") {
    problems.push(`${where}: "persist" debe ser true o false`);
  }
  for (const [index, run] of (checks.runs ?? []).entries()) {
    for (const key of Object.keys(run)) {
      if (!RUN_KEYS.has(key))
        problems.push(`${where}: runs[${index}] tiene una clave desconocida "${key}"`);
    }
    for (const key of ["inputs", "args", "contains"]) {
      const value = run[key];
      if (value !== undefined && !(Array.isArray(value) && value.every(isString))) {
        problems.push(`${where}: runs[${index}].${key} debe ser una lista de textos`);
      }
    }
    if (run.output !== undefined && typeof run.output !== "string") {
      problems.push(`${where}: runs[${index}].output debe ser un texto`);
    }
    if (run.before !== undefined && typeof run.before !== "string") {
      problems.push(`${where}: runs[${index}].before debe ser código de Python (un texto)`);
    }
  }
}

const isString = (value) => typeof value === "string";

/* ---- Lectura de archivos ---- */

function numberedDirs(parent, problems, { ignore = [] } = {}) {
  return readdirSync(parent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !ignore.includes(entry.name))
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

const rel = (file) => path.relative(process.cwd(), file) || ".";
