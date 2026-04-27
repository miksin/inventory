import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: vitePreprocess(),
    kit: {
        adapter: adapter({
            // If you have a monorepo with multiple sites and need to specify a specific folder 
            // where the .svelte-kit folder will be created, you can specify it here
            // routes: {
            //     include: ['/*'],
            //     exclude: ['<all>']
            // }
        })
    }
};

export default config;