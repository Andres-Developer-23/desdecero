import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";
import { API_FACTORIES } from "../../src/js/web/apis/index.js";
import { createInternet } from "../../src/js/web/internet.js";

const API_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../content/api");
const apis = Object.fromEntries(
  readdirSync(API_DIR).map((file) => [
    file.replace(/\.json$/, ""),
    JSON.parse(readFileSync(path.join(API_DIR, file), "utf8")),
  ]),
);

const internet = createInternet({
  pages: {
    "https://tienda.example/index.html": {
      type: "text/html; charset=utf-8",
      body: "<h1>Hola ñ</h1>",
    },
  },
  apis,
});

/** Hace una petición y devuelve la respuesta con el cuerpo JSON ya leído (data). */
function call(method, url, { headers = {}, json, body, session, clock } = {}) {
  const sent = { ...headers };
  if (json !== undefined) sent["Content-Type"] = "application/json";
  const response = internet.request(
    {
      method,
      url,
      headers: sent,
      body: json !== undefined ? JSON.stringify(json) : (body ?? null),
    },
    { session, clock },
  );
  const header = (name) =>
    response.headers.find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] ?? null;
  const data = response.body && response.type.includes("json") ? JSON.parse(response.body) : null;
  return { ...response, header, data };
}

describe("internet del simulador", () => {
  test("cada archivo de content/api tiene su API, y cada API sus datos", () => {
    assert.deepEqual(Object.keys(apis).sort(), Object.keys(API_FACTORIES).sort());
  });

  test("no sale de los sitios y APIs de práctica", () => {
    const response = internet.request({ url: "https://google.com/" });
    assert.equal(response.error, "host");
    assert.match(response.message, /api\.libreria\.example, api\.tareas\.example, tienda\.example/);
    assert.equal(internet.request({ url: "ftp://tienda.example/" }).error, "url");
    assert.equal(internet.request({ url: "no es una url" }).error, "url");
  });

  test("las páginas responden a GET y HEAD, con Content-Length en bytes; los demás métodos dan 405", () => {
    const page = call("GET", "https://tienda.example/");
    assert.equal(page.status, 200);
    assert.equal(page.header("Content-Length"), "16", "la ñ ocupa 2 bytes");
    assert.equal(call("HEAD", "https://tienda.example/").body, "");
    const post = call("POST", "https://tienda.example/");
    assert.equal(post.status, 405);
    assert.equal(post.reason, "Method Not Allowed");
    assert.equal(post.header("Allow"), "GET, HEAD");
  });

  test("las APIs avisan de las rutas que no existen y de los métodos no permitidos", () => {
    const missing = call("GET", "https://api.libreria.example/v2/libros");
    assert.equal(missing.status, 404);
    assert.equal(missing.data.error, "No existe la ruta /v2/libros");

    const notAllowed = call("DELETE", "https://api.libreria.example/v1/libros/1");
    assert.equal(notAllowed.status, 405);
    assert.equal(notAllowed.header("Allow"), "GET, HEAD");

    const redirected = call("GET", "http://api.libreria.example/v1/libros/1/");
    assert.equal(redirected.status, 200);
    assert.equal(redirected.redirected, true);
    assert.equal(redirected.url, "https://api.libreria.example/v1/libros/1/");
  });

  test("cada API responde a sus rutas de ejemplo", () => {
    for (const url of internet.urls().filter((address) => address.includes("//api."))) {
      const response = call("GET", url);
      assert.ok([200, 401].includes(response.status), `${url} → ${response.status}`);
      assert.equal(response.type, "application/json; charset=utf-8");
    }
  });
});

describe("API de la librería", () => {
  const base = "https://api.libreria.example/v1";

  test("filtra, ordena y pagina, y los enlaces conservan los filtros", () => {
    const novels = call("GET", `${base}/libros?categoria=novela&orden=-precio`).data;
    assert.equal(novels.total, 4);
    assert.deepEqual(
      novels.resultados.map((book) => book.precio),
      [47500, 45900, 42000, 39900],
    );

    const page = call("GET", `${base}/libros?por_pagina=4&pagina=2&autor=quintero`).data;
    assert.equal(page.total, 2);
    assert.deepEqual(page.resultados, []);
    assert.equal(page.siguiente, null);

    const first = call("GET", `${base}/libros?disponible=true&por_pagina=4`).data;
    assert.equal(first.paginas, 4);
    assert.equal(first.siguiente, `${base}/libros?disponible=true&por_pagina=4&pagina=2`);
    assert.ok(first.resultados.every((book) => book.disponible));
  });

  test("los datos de un libro y los errores de los parámetros", () => {
    const book = call("GET", `${base}/libros/2`).data;
    assert.equal(book.titulo, "Python para curiosos");
    assert.equal(book.moneda, "COP");
    assert.equal(book.url, `${base}/libros/2`);
    assert.ok(book.descripcion);

    assert.equal(call("GET", `${base}/libros/99`).status, 404);
    assert.match(call("GET", `${base}/libros?por_pagina=11`).data.error, /entre 1 y 10/);
    assert.match(call("GET", `${base}/libros?pagina=cero`).data.error, /«pagina»/);
    assert.deepEqual(call("GET", `${base}/libros?orden=color`).data.valores_admitidos, [
      "titulo",
      "autor",
      "precio",
      "valoracion",
      "publicado",
    ]);
  });
});

describe("API del clima", () => {
  const url = "https://api.clima.example/v1/actual?ciudad=bogota";
  const key = { "X-API-Key": "demo-clima-2026" };

  test("pide una clave válida y activa", () => {
    assert.equal(call("GET", url).status, 401);
    assert.equal(call("GET", url, { headers: { "X-API-Key": "inventada" } }).status, 401);
    assert.equal(call("GET", url, { headers: { "X-API-Key": "clave-antigua-2019" } }).status, 403);
    const ok = call("GET", url, { headers: key });
    assert.equal(ok.data.ciudad, "Bogotá");
    assert.equal(ok.header("X-RateLimit-Remaining"), "4");
  });

  test("limita a 5 peticiones cada 10 segundos, con Retry-After", () => {
    const session = internet.newSession();
    for (let i = 0; i < 5; i++) {
      assert.equal(call("GET", url, { headers: key, session, clock: i * 0.2 }).status, 200);
    }
    const limited = call("GET", url, { headers: key, session, clock: 1 });
    assert.equal(limited.status, 429);
    assert.equal(limited.header("Retry-After"), "9");
    assert.equal(call("GET", url, { headers: key, session, clock: 10 }).status, 200);
    // Otra sesión (otra ejecución) empieza de cero.
    assert.equal(call("GET", url, { headers: key, clock: 1 }).status, 200);
  });

  test("el pronóstico admite de 1 a 7 días y las alertas fallan dos veces antes de responder", () => {
    const forecast = call("GET", "https://api.clima.example/v1/pronostico?ciudad=Cali&dias=7", {
      headers: key,
    }).data;
    assert.equal(forecast.dias.length, 7);
    assert.equal(
      call("GET", "https://api.clima.example/v1/pronostico?ciudad=Cali&dias=8", { headers: key })
        .status,
      400,
    );

    const session = internet.newSession();
    const alerts = "https://api.clima.example/v1/alertas?ciudad=Leticia";
    const statuses = [0, 3, 6].map(
      (clock) => call("GET", alerts, { headers: key, session, clock }).status,
    );
    assert.deepEqual(statuses, [503, 503, 200]);
  });
});

describe("API de cambio de moneda", () => {
  test("convierte con la tasa del día y avisa de las monedas desconocidas", () => {
    const result = call(
      "GET",
      "https://api.cambio.example/v1/convertir?de=usd&a=COP&cantidad=10",
    ).data;
    assert.deepEqual(result, {
      de: "USD",
      a: "COP",
      cantidad: 10,
      tasa: 4185.5,
      resultado: 41855,
      fecha: "2026-10-29",
    });
    const rates = call("GET", "https://api.cambio.example/v1/tasas?base=EUR").data;
    assert.equal(rates.base, "EUR");
    assert.ok(!("EUR" in rates.tasas));
    assert.equal(call("GET", "https://api.cambio.example/v1/tasas?base=ABC").status, 400);
    assert.equal(
      call("GET", "https://api.cambio.example/v1/convertir?de=USD&a=EUR&cantidad=diez").status,
      400,
    );
  });
});

describe("API de tareas", () => {
  const base = "https://api.tareas.example/v1";
  const auth = { Authorization: "Bearer tk-ana-5f2b9c" };

  test("da el token con usuario y clave, y lo pide en cada ruta de tareas", () => {
    const login = call("POST", `${base}/token`, { json: { usuario: "ana", clave: "python123" } });
    assert.deepEqual(login.data, { token: "tk-ana-5f2b9c", tipo: "Bearer" });
    assert.equal(
      call("POST", `${base}/token`, { json: { usuario: "ana", clave: "x" } }).status,
      401,
    );
    const anonymous = call("GET", `${base}/tareas`);
    assert.equal(anonymous.status, 401);
    assert.equal(anonymous.header("WWW-Authenticate"), "Bearer");
    assert.equal(call("GET", `${base}/tareas`, { headers: auth }).data.length, 3);
  });

  test("crea, lee, modifica y borra, cada ejecución con sus propios datos", () => {
    const session = internet.newSession();
    const options = { headers: auth, session };
    const created = call("POST", `${base}/tareas`, { ...options, json: { titulo: " Leer " } });
    assert.equal(created.status, 201);
    assert.equal(created.header("Location"), `${base}/tareas/6`);
    assert.deepEqual(created.data, { id: 6, titulo: "Leer", hecha: false, prioridad: "media" });

    const patched = call("PATCH", `${base}/tareas/6`, { ...options, json: { hecha: true } });
    assert.equal(patched.data.hecha, true);
    const replaced = call("PUT", `${base}/tareas/6`, { ...options, json: { titulo: "Releer" } });
    assert.deepEqual(replaced.data, { id: 6, titulo: "Releer", hecha: false, prioridad: "media" });

    const deleted = call("DELETE", `${base}/tareas/1`, options);
    assert.equal(deleted.status, 204);
    assert.equal(deleted.body, "");
    assert.equal(deleted.header("Content-Length"), null);
    assert.equal(call("GET", `${base}/tareas/1`, options).status, 404);
    assert.equal(call("GET", `${base}/tareas/4`, options).status, 404, "la tarea 4 es de luis");

    assert.deepEqual(
      internet.snapshot(session, "api.tareas.example").map((task) => task.id),
      [2, 3, 4, 5, 6],
    );
    assert.equal(call("GET", `${base}/tareas`, { headers: auth }).data.length, 3);
  });

  test("valida los datos: JSON, campos conocidos y valores correctos", () => {
    const form = call("POST", `${base}/tareas`, {
      headers: { ...auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: "titulo=Leer",
    });
    assert.equal(form.status, 415);
    assert.match(form.data.error, /usa json=/);

    const invalid = call("POST", `${base}/tareas`, {
      headers: auth,
      json: { title: "Leer", prioridad: "urgente", hecha: "no" },
    });
    assert.equal(invalid.status, 422);
    assert.deepEqual(invalid.data.detalles, {
      title: "campo desconocido",
      titulo: "es obligatorio",
      hecha: "debe ser true o false",
      prioridad: "debe ser «baja», «media» o «alta»",
    });
    assert.equal(call("POST", `${base}/tareas`, { headers: auth, json: ["Leer"] }).status, 422);
    assert.equal(
      call("POST", `${base}/tareas`, {
        headers: { ...auth, "Content-Type": "application/json" },
        body: "{titulo: Leer}",
      }).status,
      400,
    );
  });
});
