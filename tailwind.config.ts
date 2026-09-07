import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7ff",
          100: "#d9edff",
          200: "#bce0ff",
          300: "#8ecdff",
          400: "#59b0ff",
          500: "#2f8fff",
          600: "#1c6fef",
          700: "#1657d1",
          800: "#1848a9",
          900: "#193f85",
        },
        ink: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5d9e2",
          300: "#b1b8c7",
          400: "#8590a6",
          500: "#65728b",
          600: "#505b72",
          700: "#424a5d",
          800: "#393f4e",
          900: "#1c2029",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(28 32 41 / 0.04), 0 1px 8px 0 rgb(28 32 41 / 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
