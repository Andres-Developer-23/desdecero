/* Simulador de APIs: requests con todos los métodos, json y la pestaña «web» con las respuestas JSON. */

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

test("requests usa las APIs de práctica con todos los métodos", async ({ page }) => {
  await openApp(page);
  const result = await check(
    page,
    `import requests

libros = requests.get("https://api.libreria.example/v1/libros", params={"categoria": "Poesía"})
assert libros.status_code == 200 and libros.ok
assert libros.headers["content-type"] == "application/json; charset=utf-8"
datos = libros.json()
assert datos["total"] == 2, datos
assert [libro["autor"] for libro in datos["resultados"]] == ["Clara Montoya", "Clara Montoya"]

try:
    requests.get("https://libreria.example/").json()
    assert False
except requests.exceptions.JSONDecodeError as error:
    assert str(error) == "Expecting value: line 1 column 1 (char 0)", str(error)

TAREAS = "https://api.tareas.example/v1/tareas"
token = requests.post("https://api.tareas.example/v1/token", json={"usuario": "ana", "clave": "python123"}).json()["token"]
sesion = requests.Session()
sesion.headers["Authorization"] = "Bearer " + token

nueva = sesion.post(TAREAS, json={"titulo": "Repasar JSON", "prioridad": "alta"})
assert nueva.status_code == 201 and nueva.reason == "Created"
assert nueva.headers["Location"] == TAREAS + "/6"
assert nueva.request.body == '{"titulo": "Repasar JSON", "prioridad": "alta"}'
assert nueva.request.headers["Content-Type"] == "application/json"

assert sesion.patch(TAREAS + "/6", json={"hecha": True}).json()["hecha"] is True
assert sesion.put(TAREAS + "/6", json={"titulo": "Repasar JSON otra vez"}).json()["prioridad"] == "media"
borrada = sesion.delete(TAREAS + "/6")
assert borrada.status_code == requests.codes.no_content and borrada.text == ""

mal = sesion.post(TAREAS, json={"titulo": ""})
assert mal.status_code == 422
assert mal.json()["detalles"] == {"titulo": "no puede estar vacío"}
assert sesion.post(TAREAS, data={"titulo": "x"}).status_code == 415
`,
    `import websim
metodos = [p["metodo"] for p in websim.peticiones()]
assert metodos == ["GET", "GET", "POST", "POST", "PATCH", "PUT", "DELETE", "POST", "POST"], metodos
creada = websim.peticiones_a("POST", "/v1/tareas")[0]
assert websim.datos_enviados(creada) == {"titulo": "Repasar JSON", "prioridad": "alta"}
assert [t["id"] for t in websim.estado_api("api.tareas.example")] == [1, 2, 3, 4, 5]
`,
  );
  expect(result.passed, result.log).toBe(true);
});

test("el límite de peticiones se cuenta en el reloj simulado y cada ejecución empieza de cero", async ({
  page,
}) => {
  await openApp(page);
  const program = `import requests, time
CLAVE = {"X-API-Key": "demo-clima-2026"}
estados = []
for ciudad in ["Cali", "Pasto", "Leticia", "Cartagena", "Medellín", "Pereira"]:
    r = requests.get("https://api.clima.example/v1/actual", params={"ciudad": ciudad}, headers=CLAVE)
    estados.append(r.status_code)
assert estados == [200, 200, 200, 200, 200, 429], estados
espera = int(r.headers["Retry-After"])
time.sleep(espera)
assert requests.get("https://api.clima.example/v1/actual", params={"ciudad": "Pereira"}, headers=CLAVE).ok
`;
  for (let run = 0; run < 2; run++) {
    const result = await check(page, program);
    expect(result.passed, result.log).toBe(true);
  }

  const failed = await check(
    page,
    `import requests
r = requests.get("https://api.clima.example/v1/ciudades")
r.raise_for_status()`,
  );
  expect(failed.log).toContain("401 Client Error: Unauthorized");
  expect(failed.log).toContain("falta la clave de acceso o el token");
});

test("la pestaña web enseña el método, los datos enviados y el JSON con formato", async ({
  page,
}) => {
  await openApp(page, "#playground");
  await runInPlayground(
    page,
    `import requests
H = {"Authorization": "Bearer tk-ana-5f2b9c"}
requests.get("https://api.tareas.example/v1/tareas", headers=H)
requests.post("https://api.tareas.example/v1/tareas", json={"titulo": "Probar la pestaña web"}, headers=H)
`,
  );

  const viewer = page.locator("#playground-web");
  const items = viewer.locator(".web-viewer__request-list li");
  await expect(items).toHaveCount(2);
  await expect(items.nth(1)).toContainText("POST");
  await expect(items.nth(1)).toContainText("201");
  await expect(viewer.locator(".web-viewer__method")).toHaveValue("POST");
  await expect(viewer.locator(".web-viewer__status")).toHaveText("201 Created");
  await expect(viewer.locator(".web-viewer__source")).toContainText(
    '"titulo": "Probar la pestaña web"',
  );
  await expect(viewer.locator(".web-viewer__source .hl-key").first()).toHaveText('"id"');

  await viewer.locator(".web-viewer__details summary").click();
  const exchange = viewer.locator(".web-viewer__exchange");
  await expect(exchange).toContainText("datos enviados");
  await expect(exchange).toContainText("Location:https://api.tareas.example/v1/tareas/6");

  // La primera petición sigue ahí, con la lista de tareas que vio el programa.
  await items.first().click();
  await expect(viewer.locator(".web-viewer__method")).toHaveValue("GET");
  await expect(viewer.locator(".web-viewer__source")).toContainText('"Comprar pan"');

  // La barra de dirección usa una sesión aparte: no ve la tarea creada ni pasa el token.
  await viewer.locator(".web-viewer__address").fill("https://api.tareas.example/v1/tareas");
  await viewer.locator(".web-viewer__address").press("Enter");
  await expect(viewer.locator(".web-viewer__status")).toHaveText("401 Unauthorized");
  await expect(viewer.locator(".web-viewer__source")).toContainText("Falta el token");
});

test("las lecciones de la ruta de APIs abren la API en la pestaña web", async ({ page }) => {
  await openApp(page, "#l-crear-con-post");
  const tabs = page.locator("#exercise-tabs");
  await expect(tabs.locator("[data-tab='web']")).toHaveAttribute("aria-selected", "true");
  const viewer = page.locator("#exercise-web");
  await expect(viewer.locator(".web-viewer__address")).toHaveValue("https://api.tareas.example/");
  await expect(viewer.locator(".web-viewer__source")).toContainText('"nombre": "API de Tareas"');
  await expect(viewer.locator(".web-viewer__modes")).toBeHidden();

  // Al ejecutar la solución, la pestaña enseña cada petición con su método.
  await page.evaluate(() => {
    const { course } = window.__desdecero;
    document
      .querySelector("#exercise-editor .CodeMirror")
      .CodeMirror.setValue(course.getLesson("crear-con-post").solution);
  });
  await page.locator("#view-lesson [data-action='run']").first().click();
  await expect(page.locator("#exercise-output")).toContainText("Creada la tarea 6");
  await tabs.locator("[data-tab='web']").click();
  const items = viewer.locator(".web-viewer__request-list li");
  await expect(items).toHaveCount(5);
  await expect(items.nth(3)).toContainText("POST");
  await expect(items.nth(3)).toContainText("422");
  await expect(viewer.locator(".web-viewer__address")).toHaveValue(
    "https://api.tareas.example/v1/tareas",
  );
  await expect(viewer.locator(".web-viewer__source")).toContainText('"Comprar café"');
});
