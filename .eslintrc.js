module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    'jest/globals': true
  },
  extends: [
    'airbnb-base',
    'plugin:jest/recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'jest'
  ],
  rules: {
    'no-plusplus': [1, { 'allowForLoopAfterthoughts': true }],
    "no-unused-vars": 0,
    "@typescript-eslint/no-unused-vars": ["error", {
      "vars": "all",
      "args": "after-used",
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "ignoreRestSiblings": false
    }],
    "import/no-extraneous-dependencies": ["error", {"devDependencies": ["**/*.test.js", "**/*.test.ts", "rollup.config.js"]}],
    '@typescript-eslint/explicit-function-return-type': 0,
  },
};
