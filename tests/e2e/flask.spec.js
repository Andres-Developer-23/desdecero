/*
 * Simulador de Flask: el módulo flask (respuestas, errores, test_client) y el
 * servidor en http://127.0.0.1:5000 que prueba la pestaña «web».
 */

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

const TAREAS_APP = `from flask import Flask, request, abort

app = Flask(__name__)
tareas = [{"id": 1, "titulo": "Leer", "hecha": False}]


@app.get("/")
def inicio():
    return "<h1>Mi API</h1>"


@app.get("/tareas")
def listar():
    return tareas


@app.post("/tareas")
def crear():
    datos = request.get_json()
    if not datos.get("titulo"):
        return {"error": "Falta el título"}, 400
    tarea = {"id": len(tareas) + 1, "titulo": datos["titulo"], "hecha": False}
    tareas.append(tarea)
    return tarea, 201


@app.get("/tareas/<int:id>")
def ver(id):
    for tarea in tareas:
        if tarea["id"] == id:
            return tarea
    abort(404)


@app.get("/falla")
def falla():
    return tareas[0]["precio"]
`;

test("flask responde como Flask: JSON ordenado, códigos, errores y test_client", async ({
  page,
}) => {
  await openApp(page);
  const result = await check(
    page,
    TAREAS_APP,
    `cliente = app.test_client()
r = cliente.get("/tareas")
assert r.status_code == 200 and r.status == "200 OK"
assert r.content_type == "application/json"
assert r.get_data(as_text=True) == '[{"hecha":false,"id":1,"titulo":"Leer"}]\\n', r.get_data(as_text=True)

r = cliente.post("/tareas", json={"titulo": "Escribir"})
assert r.status_code == 201 and r.status == "201 CREATED"
assert r.get_json() == {"id": 2, "titulo": "Escribir", "hecha": False}

assert cliente.post("/tareas", json={}).status_code == 400
assert cliente.post("/tareas", data={"titulo": "x"}).status_code == 415
assert cliente.get("/tareas/9").status_code == 404
assert "<title>404 Not Found</title>" in cliente.get("/tareas/9").get_data(as_text=True)
r = cliente.delete("/tareas/1")
assert r.status_code == 405 and r.headers["Allow"] == "GET, HEAD, OPTIONS"
assert cliente.get("/tareas/uno").status_code == 404

r = cliente.get("/falla")
assert r.status_code == 500
assert "Internal Server Error" in r.get_data(as_text=True)

# Con debug o testing, como en Flask, el error llega al cliente de pruebas.
app.testing = True
try:
    cliente.get("/falla")
    assert False, "debería lanzar KeyError"
except KeyError:
    pass
`,
  );
  expect(result.passed, result.log).toBe(true);
  // El error de la vista se explica en la consola, con la línea del alumno.
  expect(result.log).toContain("ERROR in app: Exception on /falla [GET]");
  expect(result.log).toContain("KeyError en la línea 37");
});

test("app.run() deja el servidor en marcha y la pestaña web le envía peticiones", async ({
  page,
}) => {
  await openApp(page, "#playground");
  await runInPlayground(page, `${TAREAS_APP}\napp.run(debug=True)\n`);

  const output = page.locator("#playground-output");
  await expect(output).toContainText(" * Running on http://127.0.0.1:5000");
  await expect(output).toContainText("tu servidor está en marcha en http://127.0.0.1:5000");

  const viewer = page.locator("#playground-web");
  await expect(viewer.locator(".web-viewer__address")).toHaveValue("http://127.0.0.1:5000/");
  await expect(viewer.locator(".web-viewer__status")).toHaveText("200 OK");
  await expect(page.frameLocator("#playground-web iframe").locator("h1")).toHaveText("Mi API");
  await expect(output).toContainText('"GET / HTTP/1.1" 200 -');

  // Un GET a /tareas: JSON con sangría porque está en modo debug.
  await viewer.locator(".web-viewer__address").fill("127.0.0.1:5000/tareas");
  await viewer.locator(".web-viewer__address").press("Enter");
  await expect(viewer.locator(".web-viewer__source")).toContainText('"titulo": "Leer"');

  // Un POST con datos JSON desde el navegador: el servidor guarda la tarea.
  await viewer.locator(".web-viewer__compose summary").click();
  await viewer.locator(".web-viewer__compose-body").fill('{"titulo": "Probar el POST"}');
  await viewer.locator(".web-viewer__method").selectOption("POST");
  await viewer.locator(".web-viewer__send").click();
  await expect(viewer.locator(".web-viewer__status")).toHaveText("201 CREATED");
  await expect(viewer.locator(".web-viewer__source")).toContainText('"id": 2');
  await expect(output).toContainText('"POST /tareas HTTP/1.1" 201 -');

  await viewer.locator(".web-viewer__method").selectOption("GET");
  await viewer.locator(".web-viewer__send").click();
  // La lista tiene la tarea nueva y la que ya había (la respuesta del POST solo traía la nueva).
  await expect(viewer.locator(".web-viewer__source")).toContainText("Probar el POST");
  await expect(viewer.locator(".web-viewer__source")).toContainText('"titulo": "Leer"');

  // Un error en una vista: 500 en el navegador y la explicación en la consola.
  await viewer.locator(".web-viewer__address").fill("http://127.0.0.1:5000/falla");
  await viewer.locator(".web-viewer__send").click();
  await expect(viewer.locator(".web-viewer__status")).toHaveText("500 INTERNAL SERVER ERROR");
  await expect(output).toContainText("KeyError en la línea 37");
  await expect(output).toContainText('"GET /falla HTTP/1.1" 500 -');
});

test("sin ejecutar el programa, el servidor no está en marcha", async ({ page }) => {
  await openApp(page, "#playground");
  await runInPlayground(page, `${TAREAS_APP}\nprint("sin app.run()")\n`);
  const viewer = page.locator("#playground-web");
  await viewer.locator(".web-viewer__address").fill("http://127.0.0.1:5000/");
  await viewer.locator(".web-viewer__send").click();
  await expect(viewer.locator(".web-viewer__status")).toHaveText("sin conexión");
  await expect(viewer.locator(".web-viewer__source")).toContainText(
    "el servidor no está en marcha",
  );

  // Pedir el servidor con requests desde el propio programa no funciona (app.run() bloquea).
  const result = await check(page, `import requests\nrequests.get("http://127.0.0.1:5000/")`);
  expect(result.log).toContain("ConnectionError");
  expect(result.log).toContain("app.test_client()");
});

test("las lecciones de Flask abren el servidor del alumno en la pestaña web", async ({ page }) => {
  await openApp(page, "#l-recibir-json");
  const tabs = page.locator("#exercise-tabs");
  const viewer = page.locator("#exercise-web");
  await expect(tabs.locator("[data-tab='web']")).toHaveAttribute("aria-selected", "true");
  // Antes de ejecutar, el servidor no está en marcha.
  await expect(viewer.locator(".web-viewer__address")).toHaveValue("http://127.0.0.1:5000/notas");
  await expect(viewer.locator(".web-viewer__status")).toHaveText("sin conexión");

  await page.evaluate(() => {
    const { course } = window.__desdecero;
    document
      .querySelector("#exercise-editor .CodeMirror")
      .CodeMirror.setValue(course.getLesson("recibir-json").solution);
  });
  await page.locator("#view-lesson [data-action='run']").first().click();
  await expect(page.locator("#exercise-output")).toContainText("tu servidor está en marcha");
  await expect(tabs.locator("[data-tab='web'] .tabs__dot")).toBeVisible();
  await tabs.locator("[data-tab='web']").click();
  await expect(viewer.locator(".web-viewer__status")).toHaveText("200 OK");
  await expect(viewer.locator(".web-viewer__source")).toContainText('"titulo": "Compras"');
  await expect(page.locator("#exercise-output")).toContainText('"GET /notas HTTP/1.1" 200 -');
});
