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
        /* ========================================
           🧠 DESIGN SYSTEM v3.0 - Surface Layers
           ======================================== */
        surface: {
          0: "var(--surface-0)",
          1: "var(--surface-1)",
          2: "var(--surface-2)",
          border: "var(--surface-border)",
        },

        /* Text Hierarchy */
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },

        /* Backward compatibility - Background layers */
        bg0: "var(--bg-0)",
        bg1: "var(--bg-1)",
        bg2: "var(--bg-2)",

        /* Backward compatibility - Foreground layers */
        fg0: "var(--fg-0)",
        fg1: "var(--fg-1)",
        fg2: "var(--fg-2)",
        fg3: "var(--fg3)",

        /* Backward compatibility - Lines/borders */
        line1: "var(--line-1)",
        line2: "var(--line-2)",

        /* Accent colors - Gradient system */
        accent: {
          DEFAULT: "var(--accent-primary)",
          primary: "var(--accent-primary)",
          light: "var(--accent-light)",
          dark: "var(--accent-dark)",
          subtle: "var(--accent-subtle)",
          muted: "var(--accent-muted)",
          "gradient-start": "var(--accent-gradient-start)",
          "gradient-end": "var(--accent-gradient-end)",
        },

        /* Semantic colors */
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

      /* ========================================
         🎨 GRADIENT UTILITIES
         Neural Shimmer: Cyan → Indigo
         ======================================== */
      backgroundImage: {
        "accent-gradient": "var(--accent-gradient)",
        "accent-gradient-hover": "var(--accent-gradient-hover)",
        "accent-gradient-active": "var(--accent-gradient-active)",
        "neural-shimmer":
          "linear-gradient(120deg, transparent, rgba(79, 70, 229, 0.3), transparent)",
      },

      /* Border Radius */
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        DEFAULT: "var(--radius-md)",
      },

      /* ========================================
         ✨ NEURAL SHIMMER SHADOWS
         ======================================== */
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        // Neural shimmer shadows
        hover: "var(--shadow-hover)",
        active: "var(--shadow-active)",
        neural: "var(--shadow-neural)",
        "neural-strong": "var(--shadow-neural-strong)",
        // Backward compatibility
        accent: "var(--shadow-active)",
      },

      /* ========================================
         🎬 MOTION SYSTEM ANIMATIONS
         ======================================== */
      animation: {
        // Neural shimmer animations
        "focus-wave": "focusWave 3s linear infinite",
        "ai-pulse": "aiPulse 6s ease-in-out infinite",
        flow: "flow 4s linear infinite",
        drift: "drift 20s ease-in-out infinite",

        // Existing mobile-friendly animations
        "scale-in": "scale-in 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
      },

      /* Typography - Neural precision */
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Satoshi",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: [
          "Space Grotesk",
          "SF Mono",
          "Monaco",
          "Inconsolata",
          "Fira Code",
          "monospace",
        ],
      },

      /* Spacing - 4px base scale */
      spacing: {
        "4": "1rem", // 16px
        "8": "2rem", // 32px
        "12": "3rem", // 48px
        "16": "4rem", // 64px
        "20": "5rem", // 80px
        "24": "6rem", // 96px
      },
    },
  },
  plugins: [],
};

export default config;
