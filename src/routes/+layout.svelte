<script lang="ts">
    import { page } from '$app/stores';
    import '../app.css';
</script>

<div class="min-h-screen flex flex-col">
    {#if $page.url.pathname !== '/login'}
        <nav class="bg-inventory-primary text-white p-4">
            <div class="container mx-auto flex justify-between items-center">
                <h1 class="text-xl font-bold">Family Inventory</h1>
                {#if $page.data.session}
                    <button class="bg-inventory-accent px-3 py-1 rounded">
                        Logout
                    </button>
                {/if}
            </div>
        </nav>
    {/if}

    <main class="flex-grow container mx-auto p-4">
        <slot />
    </main>

    <footer class="bg-gray-100 dark:bg-slate-800 p-4 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-300">
            © {new Date().getFullYear()} Family Inventory
        </p>
    </footer>
</div>