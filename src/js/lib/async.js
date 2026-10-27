/** Promesa que se resuelve pasados unos milisegundos. */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
