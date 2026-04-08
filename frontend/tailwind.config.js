/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fb: {
          blue:    '#1877F2',
          'blue-dark': '#166FE5',
          green:   '#42B72A',
          gray:    '#F0F2F5',
          'gray-2': '#E4E6EB',
          'gray-3': '#BCC0C4',
          text:    '#050505',
          'text-2': '#65676B',
        },
      },
    },
  },
  plugins: [],
}
