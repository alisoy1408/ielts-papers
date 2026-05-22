/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1A3A5C",
          dark: "#0F2940",
          accent: "#185FA5",
          light: "#E6F1FB",
        },
      },
    },
  },
  plugins: [],
};
