// eslint.config.js

module.exports = [
  {
    // Base configuration for the whole project
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json', './*/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      // Merged globals from your old env settings:
      globals: {
        // Node globals
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
    },
    // Instead of extends, you may merge rules from recommended configs manually.
    // You can also import recommended configs if needed.
    rules: {
      // Code style rules (using the last definition for max-len)
      'max-len': ['warn', { code: 100, ignoreComments: true, ignoreStrings: true }],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'no-var': 'error',
      'prefer-const': 'warn',

      // TypeScript-specific rules
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',

      // Promises / async
      'require-await': 'off',
      '@typescript-eslint/require-await': 'warn',

      // Code style
      'quotes': ['warn', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],

      // Imports
      'no-duplicate-imports': 'error'
    },
    // "settings" remains similar
    settings: {
      'import/resolver': {
        typescript: {},
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      },
      react: {
        version: 'detect'
      }
    },
    // Files to ignore
    ignores: ['node_modules/', 'dist/', 'build/', '*.js', '!.eslint.config.js']
  },
  // Override for Backend files
  {
    files: ['backend/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn'
    }
  },
  // Override for Frontend Web files
  {
    files: ['frontend/web/**/*.{ts,tsx}'],
    plugins: {
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off'
    }
  },
  // Override for Frontend Mobile files
  {
    files: ['frontend/mobile/**/*.{ts,tsx}'],
    plugins: {
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      'react-native': require('eslint-plugin-react-native'),
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-native/no-unused-styles': 'warn',
      'react-native/no-inline-styles': 'warn'
    }
  },
  // Override for Test files
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
    // Additional globals for Jest in test files (if needed)
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        jest: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'off'
    }
  }
];
