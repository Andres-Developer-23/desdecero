/** true si el código importa flet (y por tanto necesita vista previa). */
export const usesFlet = (code) => /^\s*(import\s+flet\b|from\s+flet\b)/m.test(code);
