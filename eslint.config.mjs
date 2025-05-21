import js from "@eslint/js";
import nextPlugin from "eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

// Create a simpler flat config without FlatCompat
const eslintConfig = [
  // Built-in recommended rules
  js.configs.recommended,
  
  // React recommended rules
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "warn",
      "react/display-name": "off",
      "react/no-unescaped-entities": "off",
      "react/jsx-key": "error",
    },
  },
  
  // Global settings
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        process: "readonly",
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
  },
  
  // Global rules
  {
    rules: {
      "no-unused-vars": [
        "warn", 
        { 
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ],
      "no-duplicate-imports": "error",
    },
  },
  
  // Next.js rules
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    plugins: {
      next: nextPlugin,
    },
    rules: {
      "next/core-web-vitals": "error",
    },
  },
  
  // Page-specific rules
  {
    files: ["pages/**/*.js", "pages/**/*.jsx"],
    rules: {
      // More specific rules for page files can go here
    },
  },
];

export default eslintConfig;

export default eslintConfig;
