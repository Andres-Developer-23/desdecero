/*
 * API de tareas (api.tareas.example): una API para crear, leer, modificar y
 * borrar datos (CRUD), con token de acceso y validación.
 *
 *   POST   /v1/token          {"usuario", "clave"} → {"token"}
 *   GET    /v1/tareas         las tareas del usuario (filtros: hecha, prioridad)
 *   POST   /v1/tareas         crea una tarea → 201 + Location
 *   GET    /v1/tareas/{id}
 *   PUT    /v1/tareas/{id}    la reemplaza entera
 *   PATCH  /v1/tareas/{id}    cambia solo los campos enviados
 *   DELETE /v1/tareas/{id}    → 204 sin cuerpo
 *
 * Todas las rutas de /v1/tareas piden la cabecera Authorization: Bearer <token>.
 * Cada programa empieza con las tareas de content/api/api.tareas.example.json.
 */

import { ApiError, clone, createApi, json } from "./server.js";

const PRIORITIES = ["baja", "media", "alta"];
const MAX_TITLE = 80;
const FIELDS = {
  titulo: { default: undefined },
  hecha: { default: false },
  prioridad: { default: "media" },
};

/** @param {object} data Datos de content/api/api.tareas.example.json */
export function createTareasApi(data) {
  const userByToken = (token) =>
    Object.keys(data.usuarios).find((name) => data.usuarios[name].token === token);

  /** Comprueba el token y pasa el usuario al manejador. */
  const authorized = (handler) => (request, context) => {
    const header = request.header("Authorization");
    const challenge = { headers: { "WWW-Authenticate": "Bearer" } };
    if (!header) {
      throw new ApiError(
        401,
        "Falta el token: envía la cabecera Authorization con el valor «Bearer <token>»",
        challenge,
      );
    }
    const [scheme, token] = header.trim().split(/\s+/);
    if (scheme.toLowerCase() !== "bearer" || !token) {
      throw new ApiError(401, "La cabecera Authorization debe ser «Bearer <token>»", challenge);
    }
    const user = userByToken(token);
    if (!user) throw new ApiError(401, "El token no es válido", challenge);
    return handler(request, context, user);
  };

  const findTask = (request, context, user) => {
    const task = context.state.tareas.find(
      (item) => String(item.id) === request.params.id && item.usuario === user,
    );
    if (!task) throw new ApiError(404, `No tienes ninguna tarea con id ${request.params.id}`);
    return task;
  };

  const publicTask = ({ usuario: _user, ...task }) => task;

  function login(request) {
    const body = objectBody(request);
    const problems = {};
    for (const field of ["usuario", "clave"]) {
      if (typeof body[field] !== "string" || !body[field]) problems[field] = "es obligatorio";
    }
    if (Object.keys(problems).length) invalid(problems);
    const account = data.usuarios[body.usuario];
    if (!account || account.clave !== body.clave) {
      throw new ApiError(401, "Usuario o clave incorrectos");
    }
    return json(200, { token: account.token, tipo: "Bearer" });
  }

  function listTasks(request, context, user) {
    let tasks = context.state.tareas.filter((task) => task.usuario === user);
    const done = request.query.get("hecha");
    if (done !== null) {
      if (!["true", "false"].includes(done.toLowerCase())) {
        throw new ApiError(400, "El parámetro «hecha» debe ser true o false");
      }
      tasks = tasks.filter((task) => task.hecha === (done.toLowerCase() === "true"));
    }
    const priority = request.query.get("prioridad");
    if (priority !== null) tasks = tasks.filter((task) => task.prioridad === priority);
    return json(200, tasks.map(publicTask));
  }

  function createTask(request, context, user) {
    const values = validate(objectBody(request), { partial: false });
    const task = { id: context.state.nextId++, ...values, usuario: user };
    context.state.tareas.push(task);
    return json(201, publicTask(task), { Location: `${request.base}/v1/tareas/${task.id}` });
  }

  function replaceTask(request, context, user) {
    const task = findTask(request, context, user);
    Object.assign(task, validate(objectBody(request), { partial: false }));
    return json(200, publicTask(task));
  }

  function updateTask(request, context, user) {
    const task = findTask(request, context, user);
    Object.assign(task, validate(objectBody(request), { partial: true }));
    return json(200, publicTask(task));
  }

  function deleteTask(request, context, user) {
    const task = findTask(request, context, user);
    context.state.tareas.splice(context.state.tareas.indexOf(task), 1);
    return json(204);
  }

  return createApi({
    host: "api.tareas.example",
    routes: [
      {
        method: "GET",
        path: "/",
        handle: ({ base }) =>
          json(200, {
            nombre: "API de Tareas",
            version: "1.0",
            descripcion:
              "Tus tareas pendientes. Consigue un token con POST /v1/token y envíalo en la " +
              "cabecera Authorization: Bearer <token>.",
            recursos: {
              token: `POST ${base}/v1/token`,
              tareas: `GET, POST ${base}/v1/tareas`,
              tarea: `GET, PUT, PATCH, DELETE ${base}/v1/tareas/{id}`,
            },
            campos: {
              titulo: `texto obligatorio, de 1 a ${MAX_TITLE} caracteres`,
              hecha: "true o false (false si no se indica)",
              prioridad: `${PRIORITIES.join(", ")} (media si no se indica)`,
            },
          }),
      },
      { method: "POST", path: "/v1/token", handle: login },
      { method: "GET", path: "/v1/tareas", handle: authorized(listTasks) },
      { method: "POST", path: "/v1/tareas", handle: authorized(createTask) },
      {
        method: "GET",
        path: "/v1/tareas/{id}",
        handle: authorized((r, c, u) => json(200, publicTask(findTask(r, c, u)))),
      },
      { method: "PUT", path: "/v1/tareas/{id}", handle: authorized(replaceTask) },
      { method: "PATCH", path: "/v1/tareas/{id}", handle: authorized(updateTask) },
      { method: "DELETE", path: "/v1/tareas/{id}", handle: authorized(deleteTask) },
    ],
    initialState: () => {
      const tareas = clone(data.tareas);
      return { tareas, nextId: Math.max(0, ...tareas.map((task) => task.id)) + 1 };
    },
    snapshot: (state) => state.tareas.map((task) => ({ ...task })),
    examples: ["/", "/v1/tareas"],
  });
}

function objectBody(request) {
  const body = request.json();
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiError(422, "Los datos deben ser un objeto JSON, entre llaves { }");
  }
  return body;
}

function invalid(problems) {
  throw new ApiError(422, "Los datos no son válidos", { extra: { detalles: problems } });
}

/** Comprueba los campos de una tarea. Con partial, solo los que se enviaron. */
function validate(body, { partial }) {
  const problems = {};
  for (const key of Object.keys(body)) {
    if (!(key in FIELDS)) problems[key] = "campo desconocido";
  }
  const values = {};
  for (const [field, { default: fallback }] of Object.entries(FIELDS)) {
    if (!(field in body)) {
      if (partial) continue;
      if (fallback === undefined) problems[field] = "es obligatorio";
      else values[field] = fallback;
      continue;
    }
    const value = body[field];
    const problem = checkField(field, value);
    if (problem) problems[field] = problem;
    else values[field] = field === "titulo" ? value.trim() : value;
  }
  if (Object.keys(problems).length) invalid(problems);
  return values;
}

function checkField(field, value) {
  if (field === "titulo") {
    if (typeof value !== "string") return "debe ser un texto";
    if (!value.trim()) return "no puede estar vacío";
    if (value.trim().length > MAX_TITLE) return `admite como máximo ${MAX_TITLE} caracteres`;
  }
  if (field === "hecha" && typeof value !== "boolean") return "debe ser true o false";
  if (field === "prioridad" && !PRIORITIES.includes(value)) {
    return "debe ser «baja», «media» o «alta»";
  }
  return null;
}
