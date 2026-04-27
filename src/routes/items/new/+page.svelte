<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	type Category = { id: string; name: string; icon: string };

	let categories: Category[] = [];
	let submitting = false;
	let error = '';

	// Form fields
	let name = '';
	let description = '';
	let category_id = '';
	let quantity = 1;
	let unit = '個';
	let low_stock_threshold = '';
	let location = '';
	let purchase_date = '';
	let expiry_date = '';
	let warranty_until = '';
	let barcode = '';
	let tags = '';

	onMount(async () => {
		try {
			const res = await fetch('/api/categories');
			if (res.ok) categories = await res.json();
		} catch {}
	});

	function dateToTimestamp(d: string): number | null {
		if (!d) return null;
		return Math.floor(new Date(d).getTime() / 1000);
	}

	async function submit() {
		error = '';
		if (!name.trim()) { error = '物品名稱為必填'; return; }
		submitting = true;
		try {
			const res = await fetch('/api/items', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: name.trim(),
					description: description || null,
					category_id: category_id || null,
					quantity,
					unit,
					low_stock_threshold: low_stock_threshold ? Number(low_stock_threshold) : null,
					location: location || null,
					purchase_date: dateToTimestamp(purchase_date),
					expiry_date: dateToTimestamp(expiry_date),
					warranty_until: dateToTimestamp(warranty_until),
					barcode: barcode || null,
					tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
				})
			});
			if (!res.ok) {
				const d = await res.json();
				error = d.error || '新增失敗';
				return;
			}
			const item = await res.json();
			goto(`/items/${item.id}`);
		} catch {
			error = 'Network error';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>新增物品 — 家庭庫存</title>
</svelte:head>

<main class="container">
	<h1>新增物品</h1>

	{#if error}<p class="error">{error}</p>{/if}

	<form on:submit|preventDefault={submit} class="item-form">
		<div class="field">
			<label for="name">名稱 <span class="required">*</span></label>
			<input id="name" bind:value={name} placeholder="物品名稱" />
		</div>
		<div class="field">
			<label for="description">描述</label>
			<textarea id="description" bind:value={description} rows="2" placeholder="選填"></textarea>
		</div>
		<div class="field">
			<label for="category">分類</label>
			<select id="category" bind:value={category_id}>
				<option value="">無分類</option>
				{#each categories as cat}
					<option value={cat.id}>{cat.icon || '📦'} {cat.name}</option>
				{/each}
			</select>
		</div>
		<div class="row">
			<div class="field">
				<label for="quantity">數量</label>
				<input id="quantity" type="number" step="0.01" bind:value={quantity} min="0" />
			</div>
			<div class="field">
				<label for="unit">單位</label>
				<input id="unit" bind:value={unit} placeholder="個" />
			</div>
			<div class="field">
				<label for="threshold">低庫存門檻</label>
				<input id="threshold" type="number" step="0.01" bind:value={low_stock_threshold} placeholder="選填" min="0" />
			</div>
		</div>
		<div class="field">
			<label for="location">存放位置</label>
			<input id="location" bind:value={location} placeholder="例：廚房、冰箱上層" />
		</div>
		<div class="row">
			<div class="field">
				<label for="purchase_date">購入日期</label>
				<input id="purchase_date" type="date" bind:value={purchase_date} />
			</div>
			<div class="field">
				<label for="expiry_date">到期日</label>
				<input id="expiry_date" type="date" bind:value={expiry_date} />
			</div>
			<div class="field">
				<label for="warranty_until">保固到期</label>
				<input id="warranty_until" type="date" bind:value={warranty_until} />
			</div>
		</div>
		<div class="field">
			<label for="barcode">條碼</label>
			<input id="barcode" bind:value={barcode} placeholder="選填" />
		</div>
		<div class="field">
			<label for="tags">標籤（逗號分隔）</label>
			<input id="tags" bind:value={tags} placeholder="例：有機,冷藏" />
		</div>
		<div class="actions">
			<button type="submit" disabled={submitting}>{submitting ? '新增中...' : '新增物品'}</button>
			<a href="/items">取消</a>
		</div>
	</form>
</main>

<style>
	.container { max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
	h1 { font-size: 1.5rem; margin-bottom: 1.5rem; }
	.item-form { display: flex; flex-direction: column; gap: 1rem; }
	.field { display: flex; flex-direction: column; gap: 0.3rem; }
	.row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
	label { font-size: 0.875rem; font-weight: 500; color: #374151; }
	.required { color: #dc2626; }
	input, select, textarea { padding: 0.4rem 0.6rem; border: 1px solid #d1d5db; border-radius: 4px; font-size: 0.95rem; }
	textarea { resize: vertical; }
	.actions { display: flex; gap: 1rem; align-items: center; margin-top: 0.5rem; }
	button { padding: 0.5rem 1.25rem; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; }
	button:disabled { opacity: 0.6; }
	a { color: #6b7280; text-decoration: none; }
	a:hover { text-decoration: underline; }
	.error { color: #dc2626; font-size: 0.875rem; }
</style>
