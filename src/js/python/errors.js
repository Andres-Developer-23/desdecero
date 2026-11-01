/* Interpretación de los errores de Python para mostrarlos en español. */

/** Explicación para principiantes de cada tipo de error. */
export const ERROR_EXPLANATIONS = {
  SyntaxError:
    "Python no entiende cómo está escrita esta línea (o la anterior). Revisa que cierres comillas y paréntesis, que pongas los dos puntos (:) al final de if, for, while y def, y que la sangría sea de 4 espacios. Si un bloque está vacío, escribe pass dentro.",
  IndentationError:
    "La sangría no cuadra. Las líneas de un mismo bloque deben empezar con los mismos espacios (4 por nivel).",
  NameError:
    "Usas un nombre que Python no conoce. ¿Está bien escrito, con las mismas mayúsculas? ¿Creaste la variable antes de usarla?",
  TypeError:
    "Estás mezclando tipos de datos que no encajan, por ejemplo sumar texto y número. Convierte con int(), float() o str().",
  ValueError:
    'El valor no tiene el formato esperado; por ejemplo, int("hola") o int("2.5") no se pueden convertir.',
  ZeroDivisionError: "Hay una división entre cero.",
  IndexError:
    "Pides una posición que no existe. Recuerda que la primera posición es 0 y la última es len(...) - 1.",
  KeyError: "Esa clave no existe en el diccionario. Usa .get() si no estás seguro de que exista.",
  AttributeError: "Ese tipo de dato no tiene ese método o atributo. Revisa cómo está escrito.",
  TimeLimitError:
    "El programa tardó demasiado y se detuvo. ¿Hay un bucle while cuya condición nunca deja de cumplirse?",
  ImportError: "Ese módulo no está disponible aquí.",
  RecursionError: "Una función se llama a sí misma sin parar.",
  MissingSchema: "La URL tiene que empezar por https:// (o http://).",
  HTTPError:
    "El servidor respondió con un código de error: 404 significa que la página no existe y 403 que no tienes permiso para verla. Revisa la URL.",
  JSONDecodeError:
    "El texto no es JSON válido. Si viene de r.json(), la respuesta no trae JSON: mira r.status_code y r.text (o la pestaña web); puede ser una página HTML o una respuesta vacía. Si el JSON lo escribiste tú, recuerda que usa comillas dobles y no admite comas al final.",
  InvalidJSONError:
    "Lo que pasaste en json= no se puede convertir a JSON: usa diccionarios, listas, textos, números, True, False o None.",
  FileNotFoundError:
    "Ese archivo no existe. En el simulador, cada ejecución empieza con el disco vacío: el programa tiene que guardarlo antes de leerlo.",
  OperationalError:
    "La base de datos no pudo ejecutar la sentencia. El mensaje dice qué tabla, columna o palabra falla; compáralo con lo que hay en la pestaña «datos».",
  IntegrityError:
    "Los datos incumplen una regla de la tabla: un valor repetido en una columna UNIQUE, uno que falta en una NOT NULL o uno que no cumple su CHECK.",
  ProgrammingError:
    "sqlite3 se está usando de una forma que no admite. Revisa los parámetros que pasas a execute() y que la conexión siga abierta.",
};

/** Explicaciones de los errores de SQLite más habituales, por su mensaje (en inglés, como en Python). */
const SQL_EXPLANATIONS = [
  [
    /^no such table/,
    "Esa tabla no existe en la base de datos. ¿Está bien escrito el nombre? ¿Se ejecutó antes el CREATE TABLE? En la pestaña «datos» ves las tablas que hay.",
  ],
  [
    /^no such column/,
    "Esa columna no existe en la tabla: revisa su nombre en la pestaña «datos» (estructura de la tabla). Si querías escribir un texto, va entre comillas simples: 'Bogotá'.",
  ],
  [
    /has no column named/,
    "El INSERT nombra una columna que la tabla no tiene. Revisa los nombres en la pestaña «datos» (estructura de la tabla).",
  ],
  [
    /has \d+ columns but \d+ values were supplied|\d+ values for \d+ columns/,
    "El número de valores no coincide con el de columnas. Escribe las columnas en el INSERT: INSERT INTO tabla (a, b) VALUES (?, ?).",
  ],
  [
    /already exists/,
    "Esa tabla ya existe. Si el programa puede ejecutarse más de una vez, escribe CREATE TABLE IF NOT EXISTS.",
  ],
  [
    /^ambiguous column name/,
    "Esa columna está en más de una tabla del JOIN: escribe de cuál es, como libros.id o autores.id.",
  ],
  [
    /^misuse of aggregate/,
    "COUNT, SUM, AVG, MIN y MAX no van en el WHERE (que filtra filas antes de agrupar): para filtrar grupos, usa HAVING después del GROUP BY.",
  ],
  [
    /^incomplete input/,
    "La sentencia SQL está incompleta: falta cerrar un paréntesis o una comilla, o termina a medias.",
  ],
  [
    /syntax error/,
    "SQL no entiende la sentencia cerca de la palabra que indica el mensaje. Revisa las comas entre columnas, las comillas simples de los textos y el orden: SELECT … FROM … WHERE … GROUP BY … ORDER BY … LIMIT.",
  ],
  [
    /^UNIQUE constraint failed/,
    "Ya hay una fila con ese valor en una columna UNIQUE o en la clave primaria, y no se puede repetir.",
  ],
  [
    /^NOT NULL constraint failed/,
    "Esa columna es NOT NULL: hay que darle un valor al insertar la fila (None se guarda como NULL).",
  ],
  [
    /^CHECK constraint failed/,
    "El valor no cumple la condición CHECK de la tabla (mírala en la estructura de la tabla, en «datos»).",
  ],
  [
    /^FOREIGN KEY constraint failed/,
    "La fila apunta a otra que no existe (un id que no está en la tabla relacionada), o se borra una fila a la que otras todavía apuntan.",
  ],
  [/^datatype mismatch/, "Una columna INTEGER PRIMARY KEY solo admite números enteros."],
  [
    /^Incorrect number of bindings/,
    "El número de ? de la sentencia no coincide con el de valores. Si es uno solo, pásalo en una tupla con su coma: (valor,).",
  ],
  [
    /^parameters are of unsupported type/,
    "Los valores van en una tupla o una lista, aunque sea uno solo: execute(sql, (valor,)).",
  ],
  [
    /^You did not supply a value for binding parameter/,
    "La sentencia usa un parámetro :nombre que no está en el diccionario de valores.",
  ],
  [
    /^Error binding parameter/,
    "SQLite solo guarda None, int, float, str y bytes. Convierte el valor antes (por ejemplo, una lista con json.dumps()).",
  ],
  [
    /^You can only execute one statement at a time/,
    "execute() ejecuta una sola sentencia. Para varias separadas por punto y coma, usa executescript().",
  ],
  [
    /^executemany\(\) can only execute DML/,
    "executemany() es para INSERT, UPDATE o DELETE con muchos grupos de valores. Para consultar, usa execute().",
  ],
  [
    /^Cannot operate on a closed/,
    "La conexión (o el cursor) ya está cerrada. Haz las consultas antes de llamar a close().",
  ],
];

const SQL_ERRORS = new Set([
  "OperationalError",
  "IntegrityError",
  "ProgrammingError",
  "DataError",
  "DatabaseError",
]);

/** Qué significa cada código de error de una API, para los HTTPError de raise_for_status(). */
const HTTP_STATUS_EXPLANATIONS = {
  400: "400: la petición está mal formada; revisa los parámetros. La respuesta suele decir cuál falla: mira r.json() o la pestaña web.",
  401: "401: falta la clave de acceso o el token, o no es válido. Revisa la cabecera que envías con headers=.",
  403: "403: el servidor sabe quién eres, pero no te deja hacer eso (por ejemplo, una clave desactivada).",
  404: "404: lo que pides no existe. Revisa la URL y el id.",
  405: "405: esa dirección no admite ese método (GET, POST...). Mira qué métodos permite la cabecera Allow.",
  415: "415: el servidor esperaba los datos en JSON. Envíalos con json= en lugar de data=.",
  422: "422: los datos que enviaste no son válidos. La respuesta explica qué campo falla: mira r.json().",
  429: "429: has hecho demasiadas peticiones seguidas. Espera los segundos que indica la cabecera Retry-After antes de volver a intentarlo.",
  503: "503: el servidor está saturado o en mantenimiento. Espera un poco y vuelve a intentarlo.",
};

/** Mensajes de Skulpt que no aportan nada al alumno. */
const UNHELPFUL_MESSAGES = new Set(["bad input"]);

/**
 * Convierte una excepción de Skulpt en un objeto sencillo.
 * @returns {{type: string, message: string, line: number | null, frames: number[]}}
 */
export function parseSkulptError(error) {
  const text = String(error?.toString ? error.toString() : error);
  const match = text.match(/^(\w+): ([\s\S]*?)(?: on line (\d+))?\s*$/);
  const frames = Array.isArray(error?.traceback)
    ? error.traceback.map((frame) => frame.lineno)
    : [];

  const type = error?.tp$name || match?.[1] || "Error";
  let message = match ? match[2] : text;
  let line = match?.[3] ? Number(match[3]) : null;
  if (frames.length && frames[0]) line = frames[0];
  if (type === "ExternalError") message = message.replace(/^Error:\s*/, "");
  if (UNHELPFUL_MESSAGES.has(message)) message = "";

  return { type, message, line, frames };
}

export const isSyntaxError = (error) =>
  error.type === "SyntaxError" || error.type === "IndentationError";

/** Mensajes de error que ya se explican solos (los escribe el simulador de Flet en español). */
const SELF_EXPLANATORY =
  /Flet 1\.0|simulador del curso|necesita content o icon|solo acepta controles|todavía no está en la página|no llamó a ft\.run|motor de SQLite/;

/** Explicación para principiantes de un error, o null si el mensaje ya basta. */
export function explainError(error) {
  if (SELF_EXPLANATORY.test(error.message)) return null;
  if (/'NoneType' object has no attribute/.test(error.message)) {
    return "Intentas usar algo que vale None. Si viene de find() o select_one(), es que no encontraron nada: revisa en el HTML (pestaña web) que la etiqueta y la clase existan, o comprueba que el resultado no sea None antes de usarlo.";
  }
  if (/'ResultSet' object has no attribute/.test(error.message)) {
    return "find_all() y select() devuelven una lista de etiquetas, no una sola. Recórrela con un for, o usa find() o select_one() si solo quieres la primera.";
  }
  if (/did not return a valid response/.test(error.message)) {
    return "Tu vista no devolvió nada (o devolvió algo que Flask no sabe enviar). Termina la función con return y un texto, un diccionario, una lista o una tupla como (datos, 201).";
  }
  if (/Working outside of (request|application) context/.test(error.message)) {
    return "request, g, jsonify y url_for solo funcionan mientras Flask atiende una petición: úsalos dentro de una vista, o prueba la vista con app.test_client(). Fuera de una petición, g y current_app funcionan dentro de «with app.app_context():».";
  }
  if (/module 'flet' has no attribute/.test(error.message)) {
    return "Ese nombre no existe en Flet 1.0 o el simulador del curso no lo incluye. Revisa las mayúsculas: los controles empiezan por mayúscula (ft.Text, ft.Button) y las constantes van en mayúsculas (ft.Colors.BLUE).";
  }
  if (SQL_ERRORS.has(error.type)) {
    const found = SQL_EXPLANATIONS.find(([pattern]) => pattern.test(error.message));
    if (found) return found[1];
  }
  if (error.type === "HTTPError") {
    const status = Number(error.message.match(/^(\d{3}) /)?.[1]);
    if (HTTP_STATUS_EXPLANATIONS[status]) return HTTP_STATUS_EXPLANATIONS[status];
  }
  return ERROR_EXPLANATIONS[error.type] ?? null;
}
