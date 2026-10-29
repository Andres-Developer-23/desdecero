/*
 * API de cambio de moneda (api.cambio.example). Sin clave de acceso.
 *
 *   GET /v1/monedas                                  códigos y nombres
 *   GET /v1/tasas?base=EUR                           cuánto vale 1 EUR en las demás
 *   GET /v1/convertir?de=COP&a=EUR&cantidad=45900    una conversión
 */

import { ApiError, createApi, json, requiredParam } from "./server.js";

/** @param {object} data Datos de content/api/api.cambio.example.json (tasas respecto al dólar). */
export function createCambioApi(data) {
  const currencies = data.monedas;

  const currency = (text, name) => {
    const code = text.trim().toUpperCase();
    if (!currencies[code]) {
      throw new ApiError(400, `Moneda desconocida en «${name}»: ${text}`, {
        extra: { monedas: Object.keys(currencies) },
      });
    }
    return code;
  };
  /** Cuántas unidades de «to» vale 1 unidad de «from», con 6 cifras significativas. */
  const rate = (from, to) =>
    Number((currencies[to].por_dolar / currencies[from].por_dolar).toPrecision(6));

  return createApi({
    host: "api.cambio.example",
    routes: [
      {
        method: "GET",
        path: "/",
        handle: ({ base }) =>
          json(200, {
            nombre: "API de Cambio de Moneda",
            version: "1.0",
            descripcion: `Tasas de cambio del ${data.fecha}. No necesita clave de acceso.`,
            recursos: {
              monedas: `${base}/v1/monedas`,
              tasas: `${base}/v1/tasas?base={moneda}`,
              convertir: `${base}/v1/convertir?de={moneda}&a={moneda}&cantidad={número}`,
            },
          }),
      },
      {
        method: "GET",
        path: "/v1/monedas",
        handle: () =>
          json(
            200,
            Object.fromEntries(
              Object.entries(currencies).map(([code, info]) => [code, info.nombre]),
            ),
          ),
      },
      {
        method: "GET",
        path: "/v1/tasas",
        handle: ({ query }) => {
          const from = currency(query.get("base") ?? "USD", "base");
          const rates = Object.keys(currencies)
            .filter((code) => code !== from)
            .map((code) => [code, rate(from, code)]);
          return json(200, { base: from, fecha: data.fecha, tasas: Object.fromEntries(rates) });
        },
      },
      {
        method: "GET",
        path: "/v1/convertir",
        handle: ({ query }) => {
          const from = currency(requiredParam(query, "de"), "de");
          const to = currency(requiredParam(query, "a"), "a");
          const text = requiredParam(query, "cantidad");
          const amount = Number(text);
          if (!/^-?\d+(\.\d+)?$/.test(text) || amount < 0) {
            throw new ApiError(400, "«cantidad» debe ser un número positivo, como 100 o 12.5");
          }
          const value = rate(from, to);
          return json(200, {
            de: from,
            a: to,
            cantidad: amount,
            tasa: value,
            resultado: Math.round(amount * value * 100) / 100,
            fecha: data.fecha,
          });
        },
      },
    ],
    examples: ["/", "/v1/monedas", "/v1/tasas?base=COP", "/v1/convertir?de=USD&a=COP&cantidad=10"],
  });
}
