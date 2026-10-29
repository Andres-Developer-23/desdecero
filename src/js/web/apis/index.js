/*
 * Las APIs de práctica, por dominio. Sus datos están en
 * content/api/<dominio>.json y el cargador del curso los incrusta en la página.
 */

import { createCambioApi } from "./cambio.js";
import { createClimaApi } from "./clima.js";
import { createLibreriaApi } from "./libreria.js";
import { createTareasApi } from "./tareas.js";

export const API_FACTORIES = {
  "api.cambio.example": createCambioApi,
  "api.clima.example": createClimaApi,
  "api.libreria.example": createLibreriaApi,
  "api.tareas.example": createTareasApi,
};

/**
 * Crea las APIs que tienen datos.
 * @param {Record<string, object>} apis Datos de cada API, por dominio.
 */
export function createApis(apis) {
  return Object.entries(apis ?? {})
    .filter(([host]) => host in API_FACTORIES)
    .map(([host, data]) => API_FACTORIES[host](data));
}
