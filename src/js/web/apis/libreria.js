/*
 * API de la librería (api.libreria.example): el mismo catálogo que la web
 * libreria.example, pero en JSON. Sin clave de acceso.
 *
 *   GET /v1/libros         filtros, orden y paginación
 *   GET /v1/libros/{id}    un libro con todos sus datos
 *   GET /v1/categorias     categorías y cuántos libros tiene cada una
 */

import { ApiError, createApi, fold, integerParam, json, sameText } from "./server.js";

const MAX_PER_PAGE = 10;
const DEFAULT_PER_PAGE = 5;
const SORT_FIELDS = ["titulo", "autor", "precio", "valoracion", "publicado"];

/** @param {{libros: object[]}} data Datos de content/api/api.libreria.example.json */
export function createLibreriaApi(data) {
  const books = data.libros;

  const summary = (book, base) => ({
    id: book.id,
    titulo: book.titulo,
    autor: book.autor,
    categoria: book.categoria,
    precio: book.precio,
    moneda: book.moneda,
    valoracion: book.valoracion,
    disponible: book.stock > 0,
    url: `${base}/v1/libros/${book.id}`,
  });

  function listBooks(request) {
    const { query, base } = request;
    const perPage = integerParam(query, "por_pagina", {
      fallback: DEFAULT_PER_PAGE,
      max: MAX_PER_PAGE,
    });
    const page = integerParam(query, "pagina", { fallback: 1 });
    let found = books.filter((book) => matches(book, query));
    found = sortBooks(found, query.get("orden"));

    const pages = Math.max(1, Math.ceil(found.length / perPage));
    const link = (number) => {
      if (number < 1 || number > pages) return null;
      const params = new URLSearchParams(query);
      params.set("pagina", String(number));
      params.set("por_pagina", String(perPage));
      return `${base}/v1/libros?${params}`;
    };
    return json(200, {
      total: found.length,
      pagina: page,
      por_pagina: perPage,
      paginas: pages,
      siguiente: link(page + 1),
      anterior: page <= pages ? link(page - 1) : null,
      resultados: found.slice((page - 1) * perPage, page * perPage).map((b) => summary(b, base)),
    });
  }

  function getBook(request) {
    const book = books.find((item) => String(item.id) === request.params.id);
    if (!book) {
      throw new ApiError(404, `No existe ningún libro con id ${request.params.id}`);
    }
    return json(200, { ...summary(book, request.base), ...book, disponible: book.stock > 0 });
  }

  function listCategories(request) {
    const names = [...new Set(books.map((book) => book.categoria))].sort((a, b) =>
      a.localeCompare(b, "es"),
    );
    return json(
      200,
      names.map((name) => ({
        nombre: name,
        libros: books.filter((book) => book.categoria === name).length,
        url: `${request.base}/v1/libros?${new URLSearchParams({ categoria: name })}`,
      })),
    );
  }

  return createApi({
    host: "api.libreria.example",
    routes: [
      {
        method: "GET",
        path: "/",
        handle: ({ base }) =>
          json(200, {
            nombre: "API de la Librería",
            version: "1.0",
            descripcion: "El catálogo de libreria.example en JSON. No necesita clave de acceso.",
            recursos: {
              libros: `${base}/v1/libros`,
              libro: `${base}/v1/libros/{id}`,
              categorias: `${base}/v1/categorias`,
            },
            parametros_de_libros: {
              categoria: "solo los libros de esa categoría",
              autor: "libros cuyo autor contenga ese texto",
              q: "busca en el título y el autor",
              disponible: "true para ver solo los libros con existencias",
              precio_max: "precio máximo, en pesos",
              orden: `${SORT_FIELDS.join(", ")} (con - delante, de mayor a menor)`,
              pagina: "número de página, desde 1",
              por_pagina: `resultados por página, de 1 a ${MAX_PER_PAGE} (${DEFAULT_PER_PAGE} si no se indica)`,
            },
          }),
      },
      { method: "GET", path: "/v1/libros", handle: listBooks },
      { method: "GET", path: "/v1/libros/{id}", handle: getBook },
      { method: "GET", path: "/v1/categorias", handle: listCategories },
    ],
    examples: ["/", "/v1/libros", "/v1/libros/1", "/v1/categorias"],
  });
}

function matches(book, query) {
  const category = query.get("categoria");
  if (category && !sameText(book.categoria, category)) return false;
  const author = query.get("autor");
  if (author && !fold(book.autor).includes(fold(author))) return false;
  const text = query.get("q");
  if (text && !fold(`${book.titulo} ${book.autor}`).includes(fold(text))) return false;
  const available = query.get("disponible");
  if (available !== null && available !== "") {
    if (!["true", "false"].includes(available.toLowerCase())) {
      throw new ApiError(400, "El parámetro «disponible» debe ser true o false");
    }
    if (book.stock > 0 !== (available.toLowerCase() === "true")) return false;
  }
  const maxPrice = integerParam(query, "precio_max", { fallback: null, min: 0 });
  if (maxPrice !== null && book.precio > maxPrice) return false;
  return true;
}

function sortBooks(books, order) {
  if (!order) return books;
  const descending = order.startsWith("-");
  const field = descending ? order.slice(1) : order;
  if (!SORT_FIELDS.includes(field)) {
    throw new ApiError(400, `No se puede ordenar por «${field}»`, {
      extra: { valores_admitidos: SORT_FIELDS },
    });
  }
  const compare = (a, b) =>
    typeof a[field] === "string" ? a[field].localeCompare(b[field], "es") : a[field] - b[field];
  return [...books].sort((a, b) => (descending ? compare(b, a) : compare(a, b)) || a.id - b.id);
}
