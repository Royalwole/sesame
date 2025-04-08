/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Fix: Add safelist for dynamically generated classes
  safelist: ["bg-wine", "text-wine", "border-wine", "hover:bg-wine"],
  theme: {
    extend: {
      colors: {
        wine: "#722f37",
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
      // Fix: Add more screen sizes for better responsiveness
      screens: {
        xs: "475px",
        // Tailwind defaults included automatically
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
  // Fix: Enable JIT mode explicitly for better performance
  mode: "jit",
};
