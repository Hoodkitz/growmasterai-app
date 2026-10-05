// https://docs.expo.dev/guides/using-eslint/
import { defineConfig } from "eslint/config";
import expoConfig from "eslint-config-expo/flat.js";

export default defineConfig([
  expoConfig,
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      globals: { __dirname: "readonly", __filename: "readonly", require: "readonly", module: "writable", process: "readonly", console: "readonly" },
    },
  },
  {
    ignores: ["dist/*"],
  },
]);
