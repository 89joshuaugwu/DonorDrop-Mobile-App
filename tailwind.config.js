/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#DC2626",
          reddark: "#991B1B",
          critical: "#DC2626",
          urgent: "#EA580C",
          normal: "#2563EB",
          success: "#16A34A",
          slate: "#64748B",
          bg: "#F8FAFC",
          border: "#E2E8F0",
          text: "#0F172A",
          textsecondary: "#64748B",
        },
      },
    },
  },
  plugins: [],
};
