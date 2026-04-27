<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
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
		purchase_date: number | null;
		expiry_date: number | null;
		warranty_until: number | null;
		barcode: string | null;
		tags: string[];
		added_by: string | null;
		updated_by: string | null;
		created_at: number;
		updated_at: number;
	};

	type Category = { id: string; name: string; icon: string };

	let item: Item | null = null;
	let category: Category | null = null;
	let loading = true;
	let error = '';

	const id = $page.params.id;

	onMount(async () => {
		try {
			const res = await fetch(`/api/items/${id}`);
			if (!res.ok) {
				error = res.status === 404 ? '找不到此物品' : '載入失敗';
				return;
			}
			item = await res.json();
			if (item?.category_id) {
				const cres = await fetch('/api/categories');
				if (cres.ok) {
					const cats: Category[] = await cres.json();
					category = cats.find((c) => c.id === item!.category_id) ?? null;
				}
			}
		} catch {
			error = 'Network error';
		} finally {
			loading = false;
		}
	});

	async function deleteItem() {
		if (!item || !confirm(`確定刪除「${item.name}」？`)) return;
		try {
			const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
			if (!res.ok && res.status !== 204) { alert('刪除失敗'); return; }
			goto('/items');
		} catch {
			alert('Network error');
		}
	}
</script>

<svelte:head>
	<title>{item?.name ?? '物品詳情'} — 家庭庫存</title>
</svelte:head>

<main class="container">
	<div class="back"><a href="/items">← 返回清單</a></div>

	{#if loading}
		<p>載入中...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else if item}
		<div class="item-header">
			<h1>{item.name}</h1>
			<div class="actions">
				<a href="/items/{id}/edit" class="btn-edit">編輯</a>
				<button class="btn-delete" on:click={deleteItem}>刪除</button>
			</div>
		</div>

		{#if item.description}
			<p class="description">{item.description}</p>
		{/if}

		<dl class="detail-grid">
			<div>
				<dt>數量</dt>
				<dd class:low={item.low_stock_threshold !== null && item.quantity <= item.low_stock_threshold}>
					{item.quantity} {item.unit}
					{#if item.low_stock_threshold !== null && item.quantity <= item.low_stock_threshold}
						<span class="badge low">低庫存</span>
					{/if}
				</dd>
			</div>
			{#if item.low_stock_threshold !== null}
				<div><dt>低庫存門檻</dt><dd>{item.low_stock_threshold} {item.unit}</dd></div>
			{/if}
			{#if category}
				<div><dt>分類</dt><dd>{category.icon || '📦'} {category.name}</dd></div>
			{/if}
			{#if item.location}
				<div><dt>存放位置</dt><dd>📍 {item.location}</dd></div>
			{/if}
			{#if item.purchase_date}
				<div><dt>購入日期</dt><dd>{formatDate(item.purchase_date)}</dd></div>
			{/if}
			{#if item.expiry_date}
				<div>
					<dt>到期日</dt>
					<dd class:expiring={isExpiringSoon(item.expiry_date)} class:expired={isExpired(item.expiry_date)}>
						{formatDate(item.expiry_date)}
						{#if isExpired(item.expiry_date)}<span class="badge expired">已到期</span>
						{:else if isExpiringSoon(item.expiry_date)}<span class="badge expiring">即將到期</span>
						{/if}
					</dd>
				</div>
			{/if}
			{#if item.warranty_until}
				<div><dt>保固到期</dt><dd>{formatDate(item.warranty_until)}</dd></div>
			{/if}
			{#if item.barcode}
				<div><dt>條碼</dt><dd>{item.barcode}</dd></div>
			{/if}
			{#if item.tags?.length}
				<div><dt>標籤</dt><dd>{item.tags.join(', ')}</dd></div>
			{/if}
			<div><dt>建立時間</dt><dd>{formatDate(item.created_at)}</dd></div>
			<div><dt>最後更新</dt><dd>{formatDate(item.updated_at)}</dd></div>
		</dl>
	{/if}
</main>

<style>
	.container { max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
	.back { margin-bottom: 1rem; }
	.back a { color: #6b7280; text-decoration: none; }
	.back a:hover { text-decoration: underline; }
	.item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
	h1 { font-size: 1.5rem; }
	.actions { display: flex; gap: 0.5rem; }
	.btn-edit { padding: 0.35rem 0.75rem; background: #e0e7ff; color: #3730a3; border-radius: 4px; text-decoration: none; font-size: 0.875rem; }
	.btn-delete { padding: 0.35rem 0.75rem; background: #fee2e2; color: #b91c1c; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
	.description { color: #374151; margin-bottom: 1.25rem; white-space: pre-wrap; }
	.detail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem 1.5rem; }
	dt { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
	dd { margin: 0; font-size: 0.95rem; font-weight: 500; }
	dd.low { color: #dc2626; }
	dd.expiring { color: #b45309; }
	dd.expired { color: #dc2626; }
	.badge { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.75rem; margin-left: 0.3rem; }
	.badge.low { background: #fee2e2; color: #b91c1c; }
	.badge.expiring { background: #fef3c7; color: #b45309; }
	.badge.expired { background: #fee2e2; color: #b91c1c; }
	.error { color: #dc2626; }
</style>
