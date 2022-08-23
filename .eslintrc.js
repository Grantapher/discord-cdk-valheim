module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
  overrides: [],
  ignorePatterns: ["**/build/*", "**/dist/*", "**/node_modules/*", "**/cdk.out/*"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "prettier/prettier": "error",
  },
};
