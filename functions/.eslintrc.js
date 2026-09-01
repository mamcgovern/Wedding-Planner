const js = require("@eslint/js");

module.exports = [
  {
    ignores: [
      "node_modules/**",
    ],
  },

  {
    files: [
      "**/*.js",
    ],

    languageOptions: {
      ecmaVersion: 2022,

      sourceType: "commonjs",

      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        require: "readonly",
        module: "readonly",
        exports: "readonly",
      },
    },

    rules: {
      ...js.configs.recommended.rules,

      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
];