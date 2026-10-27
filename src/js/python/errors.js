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
  /Flet 1\.0|simulador del curso|necesita content o icon|solo acepta controles|todavía no está en la página|no llamó a ft\.run/;

/** Explicación para principiantes de un error, o null si el mensaje ya basta. */
export function explainError(error) {
  if (SELF_EXPLANATORY.test(error.message)) return null;
  if (/module 'flet' has no attribute/.test(error.message)) {
    return "Ese nombre no existe en Flet 1.0 o el simulador del curso no lo incluye. Revisa las mayúsculas: los controles empiezan por mayúscula (ft.Text, ft.Button) y las constantes van en mayúsculas (ft.Colors.BLUE).";
  }
  return ERROR_EXPLANATIONS[error.type] ?? null;
}
