import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        "aggie-blue": "#022851",
        "aggie-gold": "#ffbf00",
        "campus-mist": "#f6f8fb",
      },
    },
  },
  plugins: [],
};

export default config;
