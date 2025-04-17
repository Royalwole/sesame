/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: ["bg-wine", "text-wine", "border-wine", "hover:bg-wine"],
  theme: {
    extend: {
      colors: {
        wine: {
          light: "#f8e5e5", // A light shade
          DEFAULT: "#8c1c13", // Main wine color - adjust to match exact shade
          dark: "#5e130c", // A darker shade for hover states
        },
        "wine-dark": "#5A252B",
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      screens: {
        xs: "475px",
      },
    },
  },
  plugins: [
    // Load plugins safely - only if they're installed
    function () {
      try {
        return require("@tailwindcss/forms");
      } catch (e) {
        console.warn("[@tailwindcss/forms] plugin not installed");
      }
    },
    function () {
      try {
        return require("@tailwindcss/typography");
      } catch (e) {
        console.warn("[@tailwindcss/typography] plugin not installed");
      }
    },
    function () {
      try {
        return require("@tailwindcss/aspect-ratio");
      } catch (e) {
        console.warn("[@tailwindcss/aspect-ratio] plugin not installed");
      }
    },
  ].filter(Boolean),
  mode: "jit",
};
