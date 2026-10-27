import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["dist/", "node_modules/", "test-results/", "playwright-report/"] },

  js.configs.recommended,

  {
    rules: {
      eqeqeq: ["error", "smart"],
      "no-var": "error",
      "prefer-const": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },

  // Código que corre en el navegador
  {
    files: ["src/js/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        // Inyectadas por esbuild desde package.json (ver scripts/build.js)
        __SKULPT_VERSION__: "readonly",
        __CODEMIRROR_VERSION__: "readonly",
      },
    },
  },

  // Scripts de build, pruebas y configuración (Node)
  {
    files: ["scripts/**/*.js", "tests/**/*.js", "*.config.js"],
    languageOptions: { globals: globals.node },
  },

  // Funciones que se ejecutan dentro de la página en las pruebas e2e
  {
    files: ["tests/e2e/**/*.js"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
