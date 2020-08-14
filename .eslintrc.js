module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  extends: [
    'standard'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    'space-before-function-paren': 'off',
    'react/jsx-filename-extension': 'off',
    'global-require': 'off',
    'func-names': 'off',
    'no-console': 'off',
    'react/jsx-props-no-spreading': 'off',
    'react/state-in-constructor': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error'
    ],
    semi: 'off',
    '@typescript-eslint/semi': [
      'error'
    ],
    'no-restricted-syntax': 'off'
  }
}
