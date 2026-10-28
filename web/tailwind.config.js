/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Storefront canvas — cool, slightly blue-tinted neutral (not pure grey).
        store: {
          body: "#f7f8fc",
        },
        // Flipkart-like blue + yellow theme
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#2874f0", // primary Flipkart blue
          600: "#1f5fd0",
          700: "#1a4fae",
          800: "#17408c",
          900: "#143670",
        },
        accent: {
          400: "#ffd233",
          500: "#ffb800", // Flipkart yellow
          600: "#e6a200",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Inter", "system-ui", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        hover: "0 10px 24px rgba(0,0,0,0.12)",
        // Softer, layered elevation for a modern feel.
        soft: "0 1px 2px rgba(16,24,40,0.04), 0 4px 12px rgba(16,24,40,0.06)",
        elevated: "0 2px 4px rgba(16,24,40,0.04), 0 12px 28px rgba(16,24,40,0.10)",
        premium: "0 8px 30px rgba(16,24,40,0.12), 0 2px 8px rgba(16,24,40,0.06)",
        glow: "0 0 0 1px rgba(40,116,240,0.14), 0 10px 30px rgba(40,116,240,0.22)",
        "glow-accent": "0 0 0 1px rgba(255,184,0,0.2), 0 10px 30px rgba(255,184,0,0.28)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)",
        "brand-sheen":
          "linear-gradient(110deg, #2874f0 0%, #4f8ef7 45%, #2874f0 100%)",
        "accent-sheen":
          "linear-gradient(110deg, #ffb800 0%, #ffd233 50%, #ffb800 100%)",
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.22, 1, 0.36, 1)",
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pop": {
          "0%": { opacity: "0", transform: "scale(0.92) translateY(10px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "float-x": {
          "0%, 100%": { transform: "translate3d(0,0,0)" },
          "50%": { transform: "translate3d(12px,-14px,0)" },
        },
        "spin-slow": {
          "100%": { transform: "rotate(360deg)" },
        },
        "shine": {
          "0%": { transform: "translateX(-60%) skewX(-18deg)" },
          "100%": { transform: "translateX(220%) skewX(-18deg)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-down": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(24px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "gradient-pan": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.35)", opacity: "0" },
          "100%": { transform: "scale(1.35)", opacity: "0" },
        },
        "shimmer-sweep": {
          "0%": { transform: "translateX(-120%)" },
          "60%, 100%": { transform: "translateX(120%)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "fade-in": "fade-in 0.25s ease-out",
        "fade-up": "fade-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-down": "fade-down 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "scale-in": "scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in-right": "slide-in-right 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "gradient-pan": "gradient-pan 8s ease infinite",
        "pulse-ring": "pulse-ring 2.2s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        "shimmer-sweep": "shimmer-sweep 2.4s ease-in-out infinite",
        pop: "pop 0.36s cubic-bezier(0.16, 1, 0.3, 1) both",
        "float-x": "float-x 14s ease-in-out infinite",
        "spin-slow": "spin-slow 18s linear infinite",
      },
    },
  },
  plugins: [],
};
