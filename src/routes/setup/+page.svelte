<script lang="ts">
	let name = '';
	let inviteCode = '';
	let error = '';
	let loading = false;

	async function createHousehold() {
		error = '';
		loading = true;
		try {
			const res = await fetch('/api/households', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name })
			});
			const data = await res.json();
			if (!res.ok) {
				error = data.error ?? 'Failed to create household';
			} else {
				inviteCode = data.invite_code;
			}
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto max-w-md p-6">
	<h1 class="mb-6 text-2xl font-bold">建立家庭群組</h1>

	{#if inviteCode}
		<div class="rounded-lg border border-green-300 bg-green-50 p-4">
			<p class="mb-2 font-semibold text-green-800">家庭群組已建立！</p>
			<p class="text-sm text-gray-600">邀請碼（可分享給家庭成員）：</p>
			<p class="mt-2 text-3xl font-mono font-bold tracking-widest text-green-700">{inviteCode}</p>
		</div>
	{:else}
		<form on:submit|preventDefault={createHousehold} class="space-y-4">
			<div>
				<label for="name" class="mb-1 block text-sm font-medium text-gray-700">家庭名稱</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					placeholder="例：林家"
					required
					class="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			{#if error}
				<p class="text-sm text-red-600">{error}</p>
			{/if}

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
			>
				{loading ? '建立中...' : '建立家庭'}
			</button>
		</form>
	{/if}
</div>
