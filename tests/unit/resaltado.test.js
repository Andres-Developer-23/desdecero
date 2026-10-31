import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { highlightHtml, highlightJson } from "../../src/js/web/highlight.js";

/** Quita las etiquetas del resaltado para comparar solo el texto. */
const text = (html) => html.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"');

describe("resaltado de la pestaña «web»", () => {
  test("da sangría al JSON de una línea y respeta los números como vienen", () => {
    const html = highlightJson('{"a": [1, 2.0, true], "b": {}, "c": [], "d": {"e": null}}');
    assert.equal(
      text(html),
      '{\n  "a": [\n    1,\n    2.0,\n    true\n  ],\n  "b": {},\n  "c": [],\n  "d": {\n    "e": null\n  }\n}',
    );
    assert.match(html, /<span class="hl-key">&quot;a&quot;<\/span>/);
    assert.match(html, /<span class="hl-number">2\.0<\/span>/);
    assert.match(html, /<span class="hl-literal">null<\/span>/);
  });

  test("escapa el HTML de los textos y no toca lo que no es JSON", () => {
    assert.equal(highlightJson('"<b>"'), '<span class="hl-string">&quot;&lt;b&gt;&quot;</span>');
    assert.equal(
      highlightJson('{"a\\u00f1o": "Bogot\\u00e1 \\/ \\"x\\""}'),
      '{\n  <span class="hl-key">&quot;año&quot;</span>: <span class="hl-string">&quot;Bogotá / \\&quot;x\\&quot;&quot;</span>\n}',
    );
    assert.equal(highlightJson("<h1>Hola</h1>"), null);
    assert.equal(highlightJson('{"a": 1,}'), null);
  });

  test("marca etiquetas, atributos y comentarios del HTML", () => {
    const html = highlightHtml('<!-- nota --><a href="/x">ir</a>');
    assert.match(html, /<span class="hl-comment">&lt;!-- nota --&gt;<\/span>/);
    assert.match(html, /<span class="hl-tag">a<\/span>/);
    assert.match(
      html,
      /<span class="hl-attr">href<\/span>=<span class="hl-value">&quot;\/x&quot;<\/span>/,
    );
  });
});
