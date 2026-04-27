<script lang="ts">
	import { onMount } from 'svelte';

	interface Member {
		id: string;
		display_name: string;
		email: string;
		role: string;
		created_at: number;
	}

	let members: Member[] = [];
	let error = '';
	let loading = true;

	onMount(async () => {
		try {
			const res = await fetch('/api/households/members');
			if (!res.ok) {
				const data = await res.json();
				error = data.error ?? 'Failed to load members';
			} else {
				const data = await res.json();
				members = data.members;
			}
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	});
</script>

<div class="container mx-auto max-w-lg p-6">
	<h1 class="mb-6 text-2xl font-bold">家庭設定</h1>

	{#if loading}
		<p class="text-gray-500">載入中...</p>
	{:else if error}
		<p class="text-red-600">{error}</p>
	{:else}
		<div class="rounded-lg border border-gray-200 bg-white shadow-sm">
			<div class="border-b px-4 py-3">
				<h2 class="font-semibold">成員列表</h2>
			</div>
			<ul class="divide-y">
				{#each members as member}
					<li class="flex items-center justify-between px-4 py-3">
						<div>
							<p class="font-medium">{member.display_name}</p>
							<p class="text-sm text-gray-500">{member.email}</p>
						</div>
						<span
							class="rounded-full px-2 py-1 text-xs font-medium {member.role === 'owner'
								? 'bg-blue-100 text-blue-700'
								: 'bg-gray-100 text-gray-600'}"
						>
							{member.role === 'owner' ? '擁有者' : '成員'}
						</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>
