<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ActionData } from "./$types";

  export let form: ActionData;
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
  <div class="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Family Inventory</h1>
    <p class="text-gray-500 dark:text-gray-400 mb-6 text-sm">
      Enter your email to receive a magic sign-in link.
    </p>

    {#if form?.success}
      <div class="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 text-sm text-green-800 dark:text-green-300 mb-4">
        ✅ Check your inbox for the sign-in link!
        {#if form.dev_token}
          <br /><span class="font-mono text-xs">(dev) token: {form.dev_token}</span>
        {/if}
      </div>
    {/if}

    {#if form?.error}
      <div class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 text-sm text-red-800 dark:text-red-300 mb-4">
        ⚠️ {form.error}
      </div>
    {/if}

    <form method="POST" use:enhance class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autocomplete="email"
          placeholder="you@example.com"
          class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        class="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 text-sm transition"
      >
        Send Magic Link
      </button>
    </form>
  </div>
</div>
