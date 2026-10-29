/** true si el código usa requests o BeautifulSoup (y por tanto pide páginas de la web de prácticas). */
export const usesWeb = (code) =>
  /^\s*(import\s+(requests|bs4)\b|from\s+(requests|bs4|urllib\.robotparser)\b)/m.test(code);
