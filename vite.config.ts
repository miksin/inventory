import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        sveltekit()
    ],
    test: {
        include: ['src/tests/**/*.test.ts', 'src/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/e2e/**'],
        globals: true,
        environment: 'node',
    }
});
