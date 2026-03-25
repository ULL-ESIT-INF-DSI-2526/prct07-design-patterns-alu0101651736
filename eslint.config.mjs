import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import tsdoc from "eslint-plugin-tsdoc";
import { rules } from "eslint-config-prettier";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.node } },
  tseslint.configs.recommended,
  {
    plugins:
    {
      tsdoc
    }
  },
  {
    rules: {
      "prefer-const": "off",
      "tsdoc/syntax": "warn"
    }
  },
  {ignores: [
    "eslint.config.mjs",
    "dist/*",
    "docs/*"
  ]    
  }
]);
