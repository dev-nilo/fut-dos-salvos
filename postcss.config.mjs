const config = {
  plugins: {
    "@tailwindcss/postcss": {
      // tailwind config snippet
      shine: {
        "0%": { "background-position": "0% 0%" },
        "50%": { "background-position": "100% 100%" },
        to: { "background-position": "0% 0%" },
      },
      // animation
      shine: "shine var(--duration) infinite linear",
    },
  },
};

export default config;
