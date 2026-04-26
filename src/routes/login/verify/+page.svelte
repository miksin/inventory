<script lang="ts">
  import type { PageData } from "./$types";
  export let data: PageData;
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
  <div class="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
    {#if data.error}
      <p class="text-red-600 dark:text-red-400 font-semibold">{data.error}</p>
      <a href="/login" class="mt-4 inline-block text-sm text-blue-600 hover:underline">Back to Login</a>
    {:else}
      <p class="text-gray-600 dark:text-gray-400 text-sm">Verifying your magic link…</p>
    {/if}
  </div>
</div>
