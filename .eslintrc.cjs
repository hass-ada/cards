// eslint-disable-next-line n/prefer-global/process
process.env.ESLINT_TSCONFIG = [
  './packages/card/tsconfig.json',
  './packages/card-bundler/tsconfig.json',
  './packages/helpers/tsconfig.json',
]

module.exports = {
  extends: ['@antfu'],
  rules: {
    'no-console': 'off',
  },
}
