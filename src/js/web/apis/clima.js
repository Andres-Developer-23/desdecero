/*
 * API del clima (api.clima.example): pide una clave de acceso y limita
 * cuántas peticiones se pueden hacer, como la mayoría de las APIs reales.
 *
 *   GET /v1/ciudades                     ciudades con datos
 *   GET /v1/actual?ciudad=Bogotá         el tiempo ahora
 *   GET /v1/pronostico?ciudad=…&dias=3   de 1 a 7 días
 *   GET /v1/alertas?ciudad=…             falla con 503 las dos primeras veces
 *                                        de cada programa, para practicar reintentos
 *
 * La clave va en la cabecera X-API-Key. El límite (5 peticiones cada 10
 * segundos del reloj simulado) se cuenta por clave; al pasarlo, la API
 * responde 429 con Retry-After.
 */

import { ApiError, createApi, integerParam, json, requiredParam, sameText } from "./server.js";

const UNSTABLE_FAILURES = 2;

/** @param {object} data Datos de content/api/api.clima.example.json */
export function createClimaApi(data) {
  const { peticiones: limit, segundos: window } = data.limite;

  /** Comprueba la clave y el límite; añade a la respuesta las cabeceras del límite. */
  const secured = (handler) => (request, context) => {
    const key = request.header("X-API-Key");
    if (!key) {
      throw new ApiError(401, "Falta la clave de acceso: envíala en la cabecera X-API-Key");
    }
    const status = data.claves[key];
    if (!status) throw new ApiError(401, "La clave de acceso no es válida");
    if (status !== "activa") throw new ApiError(403, "Esta clave de acceso está desactivada");

    const times = (context.state.requests[key] ??= []).filter((t) => t > context.clock - window);
    context.state.requests[key] = times;
    if (times.length >= limit) {
      const wait = Math.max(1, Math.ceil(times[0] + window - context.clock));
      throw new ApiError(
        429,
        `Demasiadas peticiones: el límite es ${limit} cada ${window} segundos. Espera ${wait} s.`,
        {
          headers: {
            "Retry-After": String(wait),
            "X-RateLimit-Limit": String(limit),
            "X-RateLimit-Remaining": "0",
          },
        },
      );
    }
    times.push(context.clock);
    const response = handler(request, context);
    response.headers["X-RateLimit-Limit"] = String(limit);
    response.headers["X-RateLimit-Remaining"] = String(limit - times.length);
    return response;
  };

  const findCity = (request) => {
    const name = requiredParam(request.query, "ciudad");
    const city = data.ciudades.find((item) => sameText(item.nombre, name));
    if (!city) {
      throw new ApiError(404, `No hay datos de «${name}»`, {
        extra: { ciudades: `${request.base}/v1/ciudades` },
      });
    }
    return city;
  };

  return createApi({
    host: "api.clima.example",
    routes: [
      {
        method: "GET",
        path: "/",
        handle: ({ base }) =>
          json(200, {
            nombre: "API del Clima",
            version: "1.0",
            descripcion:
              "El tiempo en ciudades de Colombia. Todas las rutas de /v1 piden una clave " +
              "de acceso en la cabecera X-API-Key.",
            clave_de_prueba: Object.keys(data.claves).find((k) => data.claves[k] === "activa"),
            limite: `${limit} peticiones cada ${window} segundos por clave`,
            recursos: {
              ciudades: `${base}/v1/ciudades`,
              actual: `${base}/v1/actual?ciudad={ciudad}`,
              pronostico: `${base}/v1/pronostico?ciudad={ciudad}&dias={1-7}`,
              alertas: `${base}/v1/alertas?ciudad={ciudad}`,
            },
          }),
      },
      {
        method: "GET",
        path: "/v1/ciudades",
        handle: secured(() =>
          json(
            200,
            data.ciudades.map((city) => ({ nombre: city.nombre, altitud: city.altitud })),
          ),
        ),
      },
      {
        method: "GET",
        path: "/v1/actual",
        handle: secured((request) => {
          const city = findCity(request);
          return json(200, { ciudad: city.nombre, fecha: data.fecha, ...city.actual });
        }),
      },
      {
        method: "GET",
        path: "/v1/pronostico",
        handle: secured((request) => {
          const city = findCity(request);
          const days = integerParam(request.query, "dias", { fallback: 3, max: 7 });
          return json(200, { ciudad: city.nombre, dias: city.pronostico.slice(0, days) });
        }),
      },
      {
        method: "GET",
        path: "/v1/alertas",
        handle: secured((request, context) => {
          context.state.alertCalls += 1;
          if (context.state.alertCalls <= UNSTABLE_FAILURES) {
            throw new ApiError(
              503,
              "El servicio de alertas está saturado. Inténtalo de nuevo en unos segundos.",
              { headers: { "Retry-After": "2" } },
            );
          }
          const city = findCity(request);
          return json(200, { ciudad: city.nombre, alertas: city.alertas });
        }),
      },
    ],
    initialState: () => ({ requests: {}, alertCalls: 0 }),
    examples: ["/", "/v1/ciudades", "/v1/actual?ciudad=Bogotá"],
  });
}
