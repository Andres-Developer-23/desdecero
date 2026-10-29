import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createVirtualWeb } from "../../src/js/scraping/web.js";

const html = (body) => ({ type: "text/html; charset=utf-8", body });

const web = createVirtualWeb({
  "https://libreria.example/index.html": html("<h1>Inicio</h1>"),
  "https://libreria.example/catalogo/index.html": html("<h1>Catálogo</h1>"),
  "https://libreria.example/catalogo/pagina-2.html": html("<h1>Página 2</h1>"),
  "https://libreria.example/404.html": html("<h1>Ups</h1>"),
  "https://citas.example/index.html": html("<h1>Citas</h1>"),
  "https://citas.example/robots.txt": { type: "text/plain; charset=utf-8", body: "User-agent: *" },
});

describe("web de prácticas", () => {
  test("sirve cada página en su URL, y cada index.html también en la de su carpeta", () => {
    assert.equal(web.resolve("https://libreria.example/").body, "<h1>Inicio</h1>");
    assert.equal(web.resolve("https://libreria.example/index.html").body, "<h1>Inicio</h1>");
    assert.equal(web.resolve("https://libreria.example/catalogo/").body, "<h1>Catálogo</h1>");

    const page = web.resolve("https://libreria.example/catalogo/pagina-2.html");
    assert.equal(page.status, 200);
    assert.equal(page.reason, "OK");
    assert.equal(page.body, "<h1>Página 2</h1>");
    assert.equal(page.type, "text/html; charset=utf-8");
    assert.equal(page.redirected, false);
  });

  test("redirige http:// a https:// y las carpetas sin barra final", () => {
    const insecure = web.resolve("http://libreria.example/");
    assert.equal(insecure.url, "https://libreria.example/");
    assert.equal(insecure.redirected, true);

    const folder = web.resolve("https://libreria.example/catalogo");
    assert.equal(folder.status, 200);
    assert.equal(folder.url, "https://libreria.example/catalogo/");
    assert.equal(folder.redirected, true);

    assert.equal(web.resolve("https://libreria.example").url, "https://libreria.example/");
  });

  test("responde 404 con la página de error del sitio, o una genérica", () => {
    const missing = web.resolve("https://libreria.example/no-existe.html");
    assert.equal(missing.status, 404);
    assert.equal(missing.reason, "Not Found");
    assert.equal(missing.body, "<h1>Ups</h1>");

    const other = web.resolve("https://citas.example/nada");
    assert.equal(other.status, 404);
    assert.match(other.body, /Esta página no existe/);
  });

  test("ignora el fragmento (#) y distingue la consulta (?)", () => {
    assert.equal(web.resolve("https://libreria.example/#arriba").status, 200);
    assert.equal(web.resolve("https://libreria.example/catalogo/?pagina=9").status, 404);
  });

  test("explica que solo se pueden visitar los sitios de práctica", () => {
    const outside = web.resolve("https://www.google.com/");
    assert.equal(outside.error, "host");
    assert.match(outside.message, /www\.google\.com/);
    assert.match(outside.message, /citas\.example, libreria\.example/);

    assert.equal(web.resolve("libreria.example").error, "url");
    assert.equal(web.resolve("ftp://libreria.example/").error, "url");
  });

  test("lista los sitios y las páginas", () => {
    assert.deepEqual(web.hosts(), ["citas.example", "libreria.example"]);
    assert.ok(web.urls().includes("https://citas.example/robots.txt"));
    assert.ok(web.urls().includes("https://libreria.example/catalogo/"));
    assert.ok(!web.urls().includes("https://libreria.example/index.html"));
    assert.ok(web.has("https://libreria.example/catalogo/pagina-2.html#x"));
    assert.ok(web.has("https://libreria.example/index.html"));
    assert.ok(!web.has("https://libreria.example/nada.html"));
  });
});
