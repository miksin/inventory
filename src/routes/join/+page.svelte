<script lang="ts">
	let inviteCode = '';
	let message = '';
	let error = '';
	let loading = false;

	async function joinHousehold() {
		error = '';
		message = '';
		loading = true;
		try {
			const res = await fetch('/api/households/join', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ invite_code: inviteCode })
			});
			const data = await res.json();
			if (!res.ok) {
				error = data.error ?? 'Failed to join household';
			} else {
				message = `成功加入「${data.name}」！`;
			}
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	}
</script>

<div class="container mx-auto max-w-md p-6">
	<h1 class="mb-6 text-2xl font-bold">加入家庭群組</h1>

	{#if message}
		<div class="rounded-lg border border-green-300 bg-green-50 p-4 text-green-800">
			{message}
		</div>
	{:else}
		<form on:submit|preventDefault={joinHousehold} class="space-y-4">
			<div>
				<label for="code" class="mb-1 block text-sm font-medium text-gray-700">邀請碼</label>
				<input
					id="code"
					type="text"
					bind:value={inviteCode}
					placeholder="輸入 6 位邀請碼"
					required
					maxlength="6"
					class="w-full rounded-md border border-gray-300 px-3 py-2 font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
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
				{loading ? '加入中...' : '加入家庭'}
			</button>
		</form>
	{/if}
</div>
