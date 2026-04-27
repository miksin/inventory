import type { Config } from 'tailwindcss';

export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],
    darkMode: 'media',
    theme: {
        extend: {
            colors: {
                'inventory-primary': '#2c3e50',
                'inventory-secondary': '#34495e',
                'inventory-accent': '#3498db',
                'inventory-warning': '#f39c12',
                'inventory-danger': '#e74c3c'
            }
        }
    },
    plugins: []
} satisfies Config;