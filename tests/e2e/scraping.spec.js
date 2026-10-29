/* Simulador de web scraping: requests, BeautifulSoup, archivos y el navegador de la web de prácticas. */

import { expect, openApp, test } from "./fixtures.js";

/** Pone código en el editor del playground y lo ejecuta. */
async function runInPlayground(page, code) {
  await page.evaluate((source) => {
    document.querySelector("#playground-editor .CodeMirror").CodeMirror.setValue(source);
  }, code);
  await page.locator("#view-playground [data-action='run']").click();
}

/** Ejecuta código con las comprobaciones de un ejercicio y devuelve el informe. */
async function check(page, code, testCode = "") {
  return page.evaluate(
    async ({ code, testCode }) => {
      const { checkExercise, createTerminal } = window.__desdecero;
      const output = document.createElement("pre");
      const result = await checkExercise(
        { checks: {}, test: testCode },
        code,
        createTerminal(output),
      );
      return { ...result, log: output.textContent };
    },
    { code, testCode },
  );
}

test("el playground enseña las páginas que pide el programa y se puede navegar por ellas", async ({
  page,
}) => {
  await openApp(page, "#playground");
  await runInPlayground(
    page,
    `import requests
requests.get("https://libreria.example/")
requests.get("https://libreria.example/catalogo/pagina-2.html")
`,
  );

  const viewer = page.locator("#playground-web");
  const frame = page.frameLocator("#playground-web iframe");
  await expect(viewer.locator(".web-viewer__request-list li")).toHaveCount(2);
  await expect(viewer.locator(".web-viewer__address")).toHaveValue(
    "https://libreria.example/catalogo/pagina-2.html",
  );
  await expect(frame.locator(".resultados")).toHaveText("Mostrando 7–12 de 18 libros");

  // Cada petición se puede volver a ver.
  await viewer.locator(".web-viewer__request-list button").first().click();
  await expect(frame.locator(".resultados")).toHaveText("Mostrando 1–6 de 18 libros");

  // Los enlaces de la página navegan dentro de la web de prácticas.
  await frame.locator("a", { hasText: "Python para curiosos" }).click();
  await expect(viewer.locator(".web-viewer__address")).toHaveValue(
    "https://libreria.example/libro/python-para-curiosos.html",
  );
  await expect(frame.locator("h1")).toHaveText("Python para curiosos");

  // El modo código enseña el HTML que recibe requests.
  await viewer.locator("[data-mode='source']").click();
  await expect(viewer.locator(".web-viewer__source")).toContainText(
    "<h1>Python para curiosos</h1>",
  );

  await viewer.locator(".web-viewer__back").click();
  await expect(viewer.locator(".web-viewer__address")).toHaveValue("https://libreria.example/");
});

test("la consola enseña los archivos que guarda el programa", async ({ page }) => {
  await openApp(page, "#playground");
  await runInPlayground(
    page,
    `import csv
with open("ciudades.csv", "w", newline="", encoding="utf-8") as archivo:
    escritor = csv.writer(archivo)
    escritor.writerow(["ciudad", "maxima"])
    escritor.writerow(["Bogotá", 19])
`,
  );
  const output = page.locator("#playground-output");
  await expect(output).toContainText("# archivo guardado: ciudades.csv · 2 líneas");
  await expect(output).toContainText("Bogotá,19");
});

test("requests y BeautifulSoup se comportan como las librerías reales", async ({ page }) => {
  await openApp(page);
  const result = await check(
    page,
    `import re
import time
import requests
from bs4 import BeautifulSoup

respuesta = requests.get("https://libreria.example/")
assert respuesta.status_code == 200 and respuesta.ok
assert respuesta.headers["content-type"] == "text/html; charset=utf-8"
sopa = BeautifulSoup(respuesta.text, "html.parser")
assert sopa.title.string == "Librería El Marcapáginas · Catálogo"

libros = sopa.find_all("article", class_="libro")
assert len(libros) == 6
primero = libros[0]
assert primero.h3.a["title"] == "El faro de la niebla"
assert primero.find("p", class_="precio").get_text() == "$ 45.900"
assert primero.select_one(".estrellas")["class"] == ["estrellas", "estrellas-4"]
assert primero.find("p", "libro__autor").text == "Marta Ibáñez"
assert sopa.find("nada") is None and sopa.select("nada") == []

precios = [p.get_text() for p in sopa.select("ol.catalogo > li article p.precio")]
assert precios[:2] == ["$ 45.900", "$ 68.500"], precios
largo = sopa.find("a", title=re.compile("^Breve"))
assert largo.get_text() == "Breve historia del café en lo…"
assert sopa.select_one("li.siguiente a")["href"] == "catalogo/pagina-2.html"
assert list(sopa.find("ul", class_="menu").stripped_strings) == ["Catálogo", "Contacto", "Carrito"]
assert sopa.find("p", class_="resultados").find_next_sibling("ol").name == "ol"

fragmento = BeautifulSoup("<p>Uno <b>dos</b></p><p class='a b'>tres</p>", "html.parser")
assert str(fragmento) == '<p>Uno <b>dos</b></p><p class="a b">tres</p>'
assert fragmento.p.get_text("|", strip=True) == "Uno|dos"
assert fragmento.p.string is None and fragmento.b.string == "dos"

# time.sleep avanza un reloj simulado: no espera de verdad.
time.sleep(30)
error = requests.get("https://libreria.example/no-existe.html", headers={"User-Agent": "MiBot/1.0"})
assert error.status_code == 404 and not error.ok
try:
    error.raise_for_status()
    assert False, "debería lanzar HTTPError"
except requests.exceptions.HTTPError as problema:
    assert str(problema).startswith("404 Client Error: Not Found for url:")
`,
    `import websim
assert websim.urls_pedidas() == ["https://libreria.example/", "https://libreria.example/no-existe.html"]
assert websim.pausas() == [30.2], websim.pausas()
assert websim.cabecera(websim.peticiones()[1], "user-agent") == "MiBot/1.0"
assert websim.cabecera(websim.peticiones()[0], "User-Agent").startswith("python-requests/")
`,
  );
  expect(result.passed, result.log).toBe(true);
});

test("urllib.parse, robots.txt, csv y open() funcionan sin red ni disco", async ({ page }) => {
  await openApp(page);
  const result = await check(
    page,
    `import csv
from urllib.parse import urljoin, urlparse, urlencode
from urllib.robotparser import RobotFileParser

base = "https://libreria.example/catalogo/pagina-2.html"
assert urljoin(base, "../libro/x.html") == "https://libreria.example/libro/x.html"
assert urljoin(base, "pagina-3.html") == "https://libreria.example/catalogo/pagina-3.html"
assert urljoin("https://refranes.example/pagina/2/", "/pagina/3/") == "https://refranes.example/pagina/3/"
assert urlparse(base).netloc == "libreria.example"
assert urlencode({"q": "café con leche", "pagina": 2}) == "q=caf%C3%A9+con+leche&pagina=2"

robots = RobotFileParser("https://libreria.example/robots.txt")
robots.read()
assert robots.can_fetch("MiBot", "https://libreria.example/")
assert not robots.can_fetch("MiBot", "https://libreria.example/carrito/")
assert robots.crawl_delay("MiBot") == 1

with open("datos.csv", "w", newline="", encoding="utf-8") as archivo:
    escritor = csv.DictWriter(archivo, fieldnames=["nombre", "nota"])
    escritor.writeheader()
    escritor.writerow({"nombre": "Ana", "nota": 4.5})
    escritor.writerow({"nombre": 'Luis "el rápido", jr', "nota": 3})
with open("datos.csv", encoding="utf-8") as archivo:
    assert archivo.read() == 'nombre,nota\\nAna,4.5\\n"Luis ""el rápido"", jr",3\\n'
with open("datos.csv", newline="", encoding="utf-8") as archivo:
    filas = list(csv.DictReader(archivo))
assert filas[1] == {"nombre": 'Luis "el rápido", jr', "nota": "3"}
try:
    open("no-existe.txt")
    assert False
except FileNotFoundError:
    pass
`,
    `import websim
assert websim.archivos() == ["datos.csv"]
assert websim.filas_csv("datos.csv")[0] == {"nombre": "Ana", "nota": "4.5"}
`,
  );
  expect(result.passed, result.log).toBe(true);
});

test("cada ejecución empieza con el disco y el registro de peticiones vacíos", async ({ page }) => {
  await openApp(page);
  const first = await check(page, 'open("nota.txt", "w").write("hola")');
  expect(first.passed, first.log).toBe(true);
  const second = await check(page, 'print(open("nota.txt").read())');
  expect(second.passed).toBe(false);
  expect(second.log).toContain("FileNotFoundError");
  expect(second.log).toContain("cada ejecución empieza con el disco vacío");
});

test("los errores típicos del scraping se explican en español", async ({ page }) => {
  await openApp(page);
  const outside = await check(page, 'import requests\nrequests.get("https://www.google.com/")');
  expect(outside.log).toContain("ConnectionError");
  expect(outside.log).toContain("solo puede visitar los sitios de práctica");

  const none = await check(
    page,
    `import requests
from bs4 import BeautifulSoup
sopa = BeautifulSoup(requests.get("https://clima.example/").text, "html.parser")
print(sopa.find("div", class_="no-existe").get_text())`,
  );
  expect(none.log).toContain("find() o select_one()");

  const list = await check(
    page,
    `from bs4 import BeautifulSoup
print(BeautifulSoup("<p>a</p>", "html.parser").find_all("p").text)`,
  );
  expect(list.log).toContain("devuelven una lista de etiquetas");

  const scheme = await check(page, 'import requests\nrequests.get("libreria.example")');
  expect(scheme.log).toContain("MissingSchema");
  expect(scheme.log).toContain("tiene que empezar por https://");
});
