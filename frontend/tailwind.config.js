/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      colors: {
        parchment: "#FAFAF7",
        sage: {
          DEFAULT: "#8BA888",
          50: "#F0F4EF",
          100: "#D8E5D6",
          200: "#B8CEAF",
          500: "#8BA888",
          700: "#5A7A57",
        },
        dust: {
          DEFAULT: "#C4A882",
          100: "#F5EDDF",
          200: "#E8D5B4",
          500: "#C4A882",
        },
        rose: {
          pastel: "#D4A5A5",
          light: "#F0DADA",
        },
        ink: {
          DEFAULT: "#2C2C2C",
          soft: "#5A5A5A",
          muted: "#8A8A8A",
        },
        border: {
          DEFAULT: "#E8E4DD",
          dark: "#333330",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.35s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
