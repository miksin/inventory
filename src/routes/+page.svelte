<script lang="ts">
	import { onMount } from 'svelte';

	interface Item {
		id: string;
		name: string;
		quantity: number;
		unit: string;
		expiry_date?: number;
		low_stock_threshold?: number;
	}

	interface Activity {
		id: string;
		member_id: string;
		action: string;
		item_id: string;
		item_name: string;
		diff: string;
		created_at: number;
	}

	let expiringSoon: Item[] = [];
	let lowStock: Item[] = [];
	let recentActivity: Activity[] = [];
	let loading = true;
	let error = '';

	let expandExpiring = false;
	let expandLowStock = false;
	let expandActivity = false;

	onMount(async () => {
		try {
			const res = await fetch('/api/dashboard');
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const data = await res.json();
			expiringSoon = data.expiring_soon ?? [];
			lowStock = data.low_stock ?? [];
			recentActivity = data.recent_activity ?? [];
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	});

	function formatDate(ts: number): string {
		return new Date(ts * 1000).toLocaleDateString();
	}

	function daysUntil(ts: number): number {
		return Math.ceil((ts * 1000 - Date.now()) / 86400000);
	}
</script>

{#if loading}
	<p class="text-gray-500 dark:text-gray-400">Loading dashboard...</p>
{:else if error}
	<p class="text-red-500">Error: {error}</p>
{:else}
<div class="grid gap-4">
	<!-- Expiring Soon -->
	<section class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
		<button
			class="w-full flex justify-between items-center"
			on:click={() => expandExpiring = !expandExpiring}
		>
			<h2 class="text-xl font-bold text-inventory-primary dark:text-white">
				⏰ Expiring Soon
				{#if expiringSoon.length > 0}
					<span class="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">{expiringSoon.length}</span>
				{/if}
			</h2>
			<span class="text-gray-400">{expandExpiring ? '▲' : '▼'}</span>
		</button>

		{#if expiringSoon.length === 0}
			<p class="mt-2 text-gray-600 dark:text-gray-300">No items expiring soon.</p>
		{:else if expandExpiring}
			<ul class="mt-3 divide-y divide-gray-100 dark:divide-slate-700">
				{#each expiringSoon as item}
					<li class="py-2 flex justify-between">
						<a href="/items/{item.id}" class="text-inventory-primary hover:underline">{item.name}</a>
						<span class="text-sm text-yellow-600">
							{item.expiry_date ? `${daysUntil(item.expiry_date)} days (${formatDate(item.expiry_date)})` : ''}
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-2 text-yellow-600 text-sm">
				{expiringSoon[0].name}{expiringSoon.length > 1 ? ` and ${expiringSoon.length - 1} more` : ''} — click to expand
			</p>
		{/if}
	</section>

	<!-- Low Stock -->
	<section class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
		<button
			class="w-full flex justify-between items-center"
			on:click={() => expandLowStock = !expandLowStock}
		>
			<h2 class="text-xl font-bold text-inventory-primary dark:text-white">
				📦 Low Stock
				{#if lowStock.length > 0}
					<span class="ml-2 text-sm bg-red-100 text-red-800 px-2 py-0.5 rounded-full">{lowStock.length}</span>
				{/if}
			</h2>
			<span class="text-gray-400">{expandLowStock ? '▲' : '▼'}</span>
		</button>

		{#if lowStock.length === 0}
			<p class="mt-2 text-gray-600 dark:text-gray-300">No items low in stock.</p>
		{:else if expandLowStock}
			<ul class="mt-3 divide-y divide-gray-100 dark:divide-slate-700">
				{#each lowStock as item}
					<li class="py-2 flex justify-between">
						<a href="/items/{item.id}" class="text-inventory-primary hover:underline">{item.name}</a>
						<span class="text-sm text-red-600">
							{item.quantity} {item.unit} / threshold: {item.low_stock_threshold}
						</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-2 text-red-600 text-sm">
				{lowStock[0].name}{lowStock.length > 1 ? ` and ${lowStock.length - 1} more` : ''} — click to expand
			</p>
		{/if}
	</section>

	<!-- Recent Activity -->
	<section class="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
		<button
			class="w-full flex justify-between items-center"
			on:click={() => expandActivity = !expandActivity}
		>
			<h2 class="text-xl font-bold text-inventory-primary dark:text-white">
				📋 Recent Activity
			</h2>
			<span class="text-gray-400">{expandActivity ? '▲' : '▼'}</span>
		</button>

		{#if recentActivity.length === 0}
			<p class="mt-2 text-gray-600 dark:text-gray-300">No recent activity.</p>
		{:else if expandActivity}
			<ul class="mt-3 divide-y divide-gray-100 dark:divide-slate-700">
				{#each recentActivity as log}
					<li class="py-2 flex justify-between text-sm">
						<span>
							<span class="capitalize font-medium">{log.action}</span>
							— <a href="/items/{log.item_id}" class="text-inventory-primary hover:underline">{log.item_name}</a>
						</span>
						<span class="text-gray-400">{formatDate(log.created_at)}</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="mt-2 text-gray-500 text-sm">
				{recentActivity[0].action} — {recentActivity[0].item_name} — click to expand
			</p>
		{/if}
	</section>
</div>
{/if}
