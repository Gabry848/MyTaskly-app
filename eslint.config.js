const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    rules: {
      //'no-console': 'warn',   // solo quando non servono piu` i log
    },
  },
];