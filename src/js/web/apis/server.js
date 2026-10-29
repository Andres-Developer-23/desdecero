/*
 * Piezas comunes de las APIs de práctica: rutas con parámetros
 * (/v1/libros/{id}), respuestas JSON y errores con el código HTTP adecuado.
 *
 * Cada API (libreria.js, clima.js...) declara sus rutas con createApi() y
 * recibe peticiones ya preparadas: método, ruta, parámetros de la consulta,
 * cabeceras en minúsculas y cuerpo. Responde con {status, headers, body}.
 *
 * No depende del navegador: se prueba en tests/unit.
 */

export const REASONS = {
  200: "OK",
  201: "Created",
  204: "No Content",
  301: "Moved Permanently",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  415: "Unsupported Media Type",
  422: "Unprocessable Entity",
  429: "Too Many Requests",
  500: "Internal Server Error",
  503: "Service Unavailable",
};

const JSON_TYPE = "application/json; charset=utf-8";

/** Un error que la API devuelve como JSON: {"error": mensaje, ...extra}. */
export class ApiError extends Error {
  constructor(status, message, { extra = {}, headers = {} } = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
    this.headers = headers;
  }
}

/** Respuesta JSON. Sin valor (204), el cuerpo queda vacío. */
export function json(status, value, headers = {}) {
  if (value === undefined) return { status, headers: { ...headers }, body: "" };
  return {
    status,
    headers: { "Content-Type": JSON_TYPE, ...headers },
    body: JSON.stringify(value),
  };
}

function errorResponse(error) {
  return json(error.status, { error: error.message, ...error.extra }, error.headers);
}

/**
 * Crea una API a partir de sus rutas.
 * @param {object} options
 * @param {string} options.host
 * @param {Array<{method: string, path: string, handle: Function}>} options.routes
 *   path admite parámetros: "/v1/libros/{id}". handle(request, context) devuelve
 *   una respuesta o lanza ApiError.
 * @param {(data: object) => object} [options.initialState] Estado de cada ejecución.
 * @param {(state: object) => unknown} [options.snapshot] Estado que puede leer websim.
 * @param {string[]} [options.examples] Rutas de ejemplo para el navegador.
 */
export function createApi({
  host,
  routes,
  initialState = () => ({}),
  snapshot = () => null,
  examples = ["/"],
}) {
  const compiled = routes.map((route) => ({ ...route, pattern: compilePath(route.path) }));
  const base = `https://${host}`;

  /**
   * @param {{method: string, url: URL, headers: Map<string, string>, body: string | null}} raw
   * @param {{clock: number, state: object}} context
   */
  function handle(raw, context) {
    const path = raw.url.pathname.replace(/(.)\/+$/, "$1");
    const matching = compiled
      .map((route) => ({ route, params: route.pattern(path) }))
      .filter(({ params }) => params !== null);
    const method = raw.method === "HEAD" ? "GET" : raw.method;
    const found = matching.find(({ route }) => route.method === method);

    try {
      if (!matching.length) {
        throw new ApiError(404, `No existe la ruta ${path}`, {
          extra: { documentacion: `${base}/` },
        });
      }
      if (!found) {
        const allowed = allowedMethods(matching.map(({ route }) => route.method));
        throw new ApiError(405, `El método ${raw.method} no está permitido en ${path}`, {
          extra: { permitidos: allowed },
          headers: { Allow: allowed.join(", ") },
        });
      }
      const request = createRequest(raw, found.params, base);
      const response = found.route.handle(request, context);
      return raw.method === "HEAD" ? { ...response, body: "" } : response;
    } catch (error) {
      if (error instanceof ApiError) return errorResponse(error);
      throw error;
    }
  }

  return {
    host,
    handle,
    initialState,
    snapshot,
    examples: examples.map((example) => base + example),
  };
}

function allowedMethods(methods) {
  const allowed = new Set(methods);
  if (allowed.has("GET")) allowed.add("HEAD");
  const order = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"];
  return order.filter((method) => allowed.has(method));
}

/** "/v1/libros/{id}" → función que devuelve {id: "3"} para "/v1/libros/3", o null. */
function compilePath(template) {
  const names = [];
  const source = template
    .split("/")
    .map((part) => {
      const name = part.match(/^\{(\w+)\}$/)?.[1];
      if (!name) return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      names.push(name);
      return "([^/]+)";
    })
    .join("/");
  const regex = new RegExp(`^${source}$`);
  return (path) => {
    const match = regex.exec(path);
    if (!match) return null;
    return Object.fromEntries(names.map((name, i) => [name, decodeURIComponent(match[i + 1])]));
  };
}

function createRequest(raw, params, base) {
  return {
    method: raw.method,
    url: raw.url,
    base,
    params,
    query: raw.url.searchParams,
    header: (name) => raw.headers.get(name.toLowerCase()) ?? null,
    body: raw.body,
    /** El cuerpo como JSON. Lanza 415 si no se envió como JSON y 400 si no es válido. */
    json() {
      const type = raw.headers.get("content-type") ?? "";
      if (!type.toLowerCase().startsWith("application/json")) {
        throw new ApiError(
          415,
          "Envía los datos en formato JSON: con requests, usa json= en lugar de data=",
        );
      }
      try {
        return JSON.parse(raw.body ?? "");
      } catch {
        throw new ApiError(400, "El cuerpo de la petición no es JSON válido");
      }
    },
  };
}

/* ---- Ayudas para leer los parámetros de la consulta ---- */

/** Un parámetro entero (o el valor por defecto), dentro de [min, max]; si no, 400. */
export function integerParam(query, name, { fallback, min = 1, max = Infinity }) {
  const text = query.get(name);
  if (text === null || text === "") return fallback;
  const value = Number(text);
  if (!/^-?\d+$/.test(text.trim()) || value < min || value > max) {
    const range = max === Infinity ? `mayor o igual que ${min}` : `entre ${min} y ${max}`;
    throw new ApiError(400, `El parámetro «${name}» debe ser un número entero ${range}`);
  }
  return value;
}

/** Un parámetro obligatorio; si falta, 400. */
export function requiredParam(query, name) {
  const value = query.get(name);
  if (value === null || value.trim() === "") {
    throw new ApiError(400, `Falta el parámetro «${name}»`);
  }
  return value.trim();
}

/** Compara textos sin distinguir mayúsculas ni tildes ("bogota" = "Bogotá"). */
export function sameText(a, b) {
  return fold(a) === fold(b);
}

export function fold(text) {
  return String(text).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Copia profunda de datos JSON. */
export const clone = (value) => JSON.parse(JSON.stringify(value));
