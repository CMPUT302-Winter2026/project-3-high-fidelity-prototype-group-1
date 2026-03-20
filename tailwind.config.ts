import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#f8f1e6",
        ink: "#1f2933",
        moss: {
          50: "#eef6ef",
          100: "#d8e8d7",
          500: "#4f7b5b",
          700: "#345242",
          900: "#22342d"
        },
        clay: {
          50: "#fff3ea",
          100: "#f7dfca",
          400: "#d58d4f",
          500: "#c4702e"
        },
        lake: {
          50: "#eef7fb",
          100: "#d1e9f2",
          500: "#4e88a2"
        }
      },
      boxShadow: {
        card: "0 14px 30px -18px rgba(31, 41, 51, 0.28)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      fontFamily: {
        display: [
          "\"Iowan Old Style\"",
          "\"Palatino Linotype\"",
          "\"Book Antiqua\"",
          "Georgia",
          "serif"
        ],
        sans: [
          "\"Avenir Next\"",
          "\"Segoe UI\"",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
};

export default config;
