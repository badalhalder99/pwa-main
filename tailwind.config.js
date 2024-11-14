// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// }

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        "2xsmall": "320px",
        "xsmall": "480px",
        "small": "576px",
        "medium": "768px",
        "large": "1024px",
        "xlarge": "1200px",
        "2xlarge": "1400px",
      },
    },
  },
  plugins: [],
}
