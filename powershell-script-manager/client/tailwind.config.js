/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Cascadia Code",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)",
        "soft-lg":
          "0 10px 40px -10px rgb(15 23 42 / 0.12), 0 4px 16px -4px rgb(15 23 42 / 0.08)",
        "soft-dark":
          "0 1px 3px 0 rgb(0 0 0 / 0.35), 0 1px 2px -1px rgb(0 0 0 / 0.25)",
        "btn-primary":
          "0 4px 14px -2px rgb(14 165 233 / 0.45), 0 2px 6px -2px rgb(15 23 42 / 0.12)",
        "btn-primary-dark":
          "0 4px 14px -2px rgb(56 189 248 / 0.35), 0 2px 6px -2px rgb(0 0 0 / 0.35)",
      },
      keyframes: {
        "toast-in": {
          "0%": { opacity: "0", transform: "translate(-50%, 12px)" },
          "100%": { opacity: "1", transform: "translate(-50%, 0)" },
        },
      },
      animation: {
        "toast-in": "toast-in 0.28s ease-out forwards",
      },
    },
  },
  plugins: [],
};
