const { defineConfig, globalIgnores } = require('eslint/config');

const tsParser = require('@typescript-eslint/parser');
const typescriptEslintEslintPlugin = require('@typescript-eslint/eslint-plugin');
const globals = require('globals');
const js = require('@eslint/js');
const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  {
    languageOptions: {
      parser: tsParser,
      sourceType: 'module',
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslintEslintPlugin,
    },
    extends: compat.extends(
      'plugin:@typescript-eslint/recommended',
      'plugin:prettier/recommended',
    ),
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  globalIgnores([
    'dist/',
    'node_modules/',
    'coverage/',
    'apps/frontend-cms/',
    'apps/frontend-consumer/',
    '**/*.js',
  ]),
  {
    files: [
      'apps/admin/**/*.ts',
      'apps/product-admin/**/*.ts',
      'apps/product-consumer/**/*.ts',
      'apps/redistro/**/*.ts',
      'apps/user-admin/**/*.ts',
      'apps/user-consumer/**/*.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@core/loyalty', '@core/loyalty/*'],
              message:
                'Loyalty must be called through its HTTP API only. Do not import @core/loyalty directly.',
            },
          ],
        },
      ],
    },
  },
]);
