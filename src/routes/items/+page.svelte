<script lang="ts">
	import { onMount } from 'svelte';
	import { formatDate, isExpiringSoon, isExpired } from '$lib/utils';

	type Item = {
		id: string;
		category_id: string | null;
		name: string;
		description: string | null;
		quantity: number;
		unit: string;
		low_stock_threshold: number | null;
		location: string | null;
		expiry_date: number | null;
		tags: string[];
	};

	type Category = { id: string; name: string; icon: string };

	let items: Item[] = [];
	let categories: Category[] = [];
	let loading = true;
	let error = '';

	// Filters
	let filterCategory = '';
	let filterSearch = '';
	let filterExpirySoon = false;
	let filterLowStock = false;

	onMount(async () => {
		await Promise.all([loadItems(), loadCategories()]);
	});

	async function buildQuery() {
		const params = new URLSearchParams();
		if (filterCategory) params.set('category_id', filterCategory);
		if (filterSearch) params.set('search', filterSearch);
		if (filterExpirySoon) params.set('expiry_soon', '1');
		if (filterLowStock) params.set('low_stock', '1');
		return `/api/items?${params}`;
	}

	async function loadItems() {
		loading = true;
		error = '';
		try {
			const url = await buildQuery();
			const res = await fetch(url);
			if (!res.ok) throw new Error(await res.text());
			items = await res.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load items';
		} finally {
			loading = false;
		}
	}

	async function loadCategories() {
		try {
			const res = await fetch('/api/categories');
			if (res.ok) categories = await res.json();
		} catch {}
	}

	function getCategoryName(id: string | null) {
		if (!id) return '';
		return categories.find((c) => c.id === id)?.name ?? '';
	}

	async function deleteItem(id: string, name: string) {
		if (!confirm(`確定刪除「${name}」？`)) return;
		try {
			const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
			if (!res.ok && res.status !== 204) { alert('刪除失敗'); return; }
			items = items.filter((i) => i.id !== id);
		} catch {
			alert('Network error');
		}
	}
</script>

<svelte:head>
	<title>物品清單 — 家庭庫存</title>
</svelte:head>

<main class="container">
	<div class="header">
		<h1>物品清單</h1>
		<a href="/items/new" class="btn-primary">+ 新增物品</a>
	</div>

	<section class="filters">
		<input bind:value={filterSearch} placeholder="搜尋名稱、描述、位置..." on:input={loadItems} />
		<select bind:value={filterCategory} on:change={loadItems}>
			<option value="">所有分類</option>
			{#each categories as cat}
				<option value={cat.id}>{cat.icon || '📦'} {cat.name}</option>
			{/each}
		</select>
		<label>
			<input type="checkbox" bind:checked={filterExpirySoon} on:change={loadItems} />
			即將到期
		</label>
		<label>
			<input type="checkbox" bind:checked={filterLowStock} on:change={loadItems} />
			低庫存
		</label>
	</section>

	{#if loading}
		<p>載入中...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if items.length === 0}
		<p class="empty">目前沒有物品。</p>
	{:else}
		<ul class="item-list">
			{#each items as item (item.id)}
				<li class:expiring={isExpiringSoon(item.expiry_date)} class:expired={isExpired(item.expiry_date)}>
					<div class="item-main">
						<a href="/items/{item.id}" class="item-name">{item.name}</a>
						{#if item.location}<span class="meta">📍 {item.location}</span>{/if}
						{#if getCategoryName(item.category_id)}<span class="meta">🏷 {getCategoryName(item.category_id)}</span>{/if}
					</div>
					<div class="item-meta">
						<span class="qty" class:low={item.low_stock_threshold !== null && item.quantity <= item.low_stock_threshold}>
							{item.quantity} {item.unit}
						</span>
						{#if item.expiry_date}
							<span class="expiry">{isExpired(item.expiry_date) ? '已到期' : `到期 ${formatDate(item.expiry_date)}`}</span>
						{/if}
					</div>
					<div class="item-actions">
						<a href="/items/{item.id}/edit" class="btn-edit">編輯</a>
						<button class="btn-delete" on:click={() => deleteItem(item.id, item.name)}>刪除</button>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	.container { max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
	.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
	h1 { font-size: 1.5rem; }
	.btn-primary { padding: 0.4rem 1rem; background: #4f46e5; color: white; border-radius: 4px; text-decoration: none; }
	.filters { display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center; margin-bottom: 1rem; padding: 0.75rem; background: #f9fafb; border-radius: 8px; }
	.filters input:not([type=checkbox]) { flex: 1; min-width: 140px; padding: 0.4rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; }
	.filters select { padding: 0.4rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; }
	.filters label { display: flex; align-items: center; gap: 0.3rem; font-size: 0.875rem; }
	.item-list { list-style: none; padding: 0; }
	li { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid #eee; flex-wrap: wrap; }
	li.expiring { background: #fffbeb; }
	li.expired { background: #fef2f2; }
	.item-main { flex: 1; min-width: 200px; display: flex; flex-direction: column; gap: 0.2rem; }
	.item-name { font-weight: 600; color: #1a1a1a; text-decoration: none; }
	.item-name:hover { text-decoration: underline; }
	.meta { font-size: 0.8rem; color: #666; }
	.item-meta { display: flex; gap: 0.5rem; align-items: center; }
	.qty { font-size: 0.9rem; }
	.qty.low { color: #dc2626; font-weight: 600; }
	.expiry { font-size: 0.8rem; color: #b45309; }
	.item-actions { display: flex; gap: 0.4rem; }
	.btn-edit { padding: 0.3rem 0.6rem; background: #e0e7ff; color: #3730a3; border-radius: 4px; text-decoration: none; font-size: 0.875rem; }
	.btn-delete { padding: 0.3rem 0.6rem; background: #fee2e2; color: #b91c1c; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
	.empty { color: #666; }
	.error { color: #dc2626; }
</style>
