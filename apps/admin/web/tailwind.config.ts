import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./services/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: "#1A237E",
          mint: "#00E676",
          slate: "#F5F7FA",
          charcoal: "#263238",
        },
      },
      fontFamily: {
        heading: ["var(--font-montserrat)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 45px rgba(26, 35, 126, 0.12)",
      },
    },
  },
};

export default config;
