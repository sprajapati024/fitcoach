import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./styles/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background layers
        bg0: "var(--bg-0)",
        bg1: "var(--bg-1)",
        bg2: "var(--bg-2)",

        // Foreground layers
        fg0: "var(--fg-0)",
        fg1: "var(--fg-1)",
        fg2: "var(--fg-2)",

        // Lines/borders
        line1: "var(--line-1)",
        line2: "var(--line-2)",

        // Accent colors (subtle cyan)
        accent: {
          DEFAULT: "var(--accent-primary)",
          primary: "var(--accent-primary)",
          light: "var(--accent-light)",
          dark: "var(--accent-dark)",
          subtle: "var(--accent-subtle)",
          muted: "var(--accent-muted)",
        },

        // Semantic colors
        success: {
          DEFAULT: "var(--success)",
          light: "var(--success-light)",
          bg: "var(--success-bg)",
        },
        error: {
          DEFAULT: "var(--error)",
          light: "var(--error-light)",
          bg: "var(--error-bg)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          light: "var(--warning-light)",
          bg: "var(--warning-bg)",
        },
        info: {
          DEFAULT: "var(--info)",
          light: "var(--info-light)",
          bg: "var(--info-bg)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        DEFAULT: "var(--radius-md)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        accent: "var(--shadow-accent)",
      },
      animation: {
        "scale-in": "scale-in 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
