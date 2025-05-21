module.exports = {
  // ...existing config
  rules: {
    // ...existing rules
    "no-duplicate-imports": "error",
    "import/no-duplicates": "error",
  },
  overrides: [
    {
      files: ["pages/**/*.js", "pages/**/*.jsx"],
      rules: {
        // Custom rule to prevent duplicate page files
        "file-extension-in-import": ["error", "always"],
      },
    },
  ],
};
