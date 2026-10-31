/**
 * true si el código usa el simulador web: pide páginas o APIs (requests,
 * BeautifulSoup, robots.txt) o crea un servidor con Flask.
 */
export const usesWeb = (code) =>
  /^\s*(import\s+(requests|bs4|flask)\b|from\s+(requests|bs4|urllib\.robotparser|flask)\b)/m.test(
    code,
  );

/** true si el código crea una aplicación de Flask. */
export const usesFlask = (code) => /^\s*(import\s+flask\b|from\s+flask\b)/m.test(code);
