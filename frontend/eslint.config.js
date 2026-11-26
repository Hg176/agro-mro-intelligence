import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import jsxA11y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist", "coverage", "mock-worker"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": "error",
      // Token, sessÃ£o e auth nunca vÃ£o para o armazenamento do navegador (login por cookie HttpOnly).
      "no-restricted-globals": [
        "error",
        {
          name: "localStorage",
          message: "O front nÃ£o guarda nada no localStorage (ver frontend/README.md).",
        },
        {
          name: "sessionStorage",
          message: "O front nÃ£o guarda nada no sessionStorage (ver frontend/README.md).",
        },
      ],
    },
  },
  {
    files: ["**/*.{js,mjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
    },
  },
  {
    files: ["vite.config.ts", "tests/**/*.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier,
]);
