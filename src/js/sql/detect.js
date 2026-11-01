/** true si el código usa el módulo sqlite3. */
export const usesSqlite = (code) => /^\s*(import\s+sqlite3\b|from\s+sqlite3\b)/m.test(code);
