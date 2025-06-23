import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  {
    rules: {
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
      'no-prototype-builtins': 'off', // Often fine in modern JS, can be project specific
      'space-before-function-paren': ['error', 'never'], // Example formatting rule
    }
  },
  {
    files: ['__tests__/**'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
    rules: {
      // Specific rules for tests can go here if needed
    }
  },
  {
    ignores: ['dist/', 'coverage/', 'node_modules/']
  }
];
