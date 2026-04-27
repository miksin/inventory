<script lang="ts">
	import { onMount } from 'svelte';

	type Category = {
		id: string;
		name: string;
		icon: string;
		color: string;
		sort_order: number;
	};

	let categories: Category[] = [];
	let loading = true;
	let error = '';

	// Form state
	let newName = '';
	let newIcon = '';
	let newColor = '#4f46e5';
	let adding = false;
	let addError = '';

	let editingId: string | null = null;
	let editName = '';
	let editIcon = '';
	let editColor = '';
	let editSortOrder = 0;
	let editError = '';

	onMount(async () => {
		await loadCategories();
	});

	async function loadCategories() {
		loading = true;
		error = '';
		try {
			const res = await fetch('/api/categories');
			if (!res.ok) throw new Error(await res.text());
			categories = await res.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load categories';
		} finally {
			loading = false;
		}
	}

	async function addCategory() {
		addError = '';
		if (!newName.trim()) { addError = '分類名稱為必填'; return; }
		adding = true;
		try {
			const res = await fetch('/api/categories', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: newName.trim(), icon: newIcon, color: newColor, sort_order: categories.length })
			});
			if (!res.ok) { const d = await res.json(); addError = d.error || 'Failed'; return; }
			const cat = await res.json();
			categories = [...categories, cat];
			newName = ''; newIcon = ''; newColor = '#4f46e5';
		} catch {
			addError = 'Network error';
		} finally {
			adding = false;
		}
	}

	function startEdit(cat: Category) {
		editingId = cat.id;
		editName = cat.name;
		editIcon = cat.icon;
		editColor = cat.color || '#4f46e5';
		editSortOrder = cat.sort_order;
		editError = '';
	}

	function cancelEdit() { editingId = null; }

	async function saveEdit(id: string) {
		editError = '';
		if (!editName.trim()) { editError = '名稱為必填'; return; }
		try {
			const res = await fetch(`/api/categories/${id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: editName.trim(), icon: editIcon, color: editColor, sort_order: editSortOrder })
			});
			if (!res.ok) { const d = await res.json(); editError = d.error || 'Failed'; return; }
			const updated = await res.json();
			categories = categories.map(c => c.id === id ? updated : c);
			editingId = null;
		} catch {
			editError = 'Network error';
		}
	}

	async function deleteCategory(id: string) {
		if (!confirm('確定刪除此分類？')) return;
		try {
			const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
			if (!res.ok && res.status !== 204) { alert('刪除失敗'); return; }
			categories = categories.filter(c => c.id !== id);
		} catch {
			alert('Network error');
		}
	}
</script>

<svelte:head>
	<title>分類管理 — 家庭庫存</title>
</svelte:head>

<main class="container">
	<h1>分類管理</h1>

	{#if loading}
		<p>載入中...</p>
	{:else if error}
		<p class="error">{error}</p>
	{:else}
		<section class="add-form">
			<h2>新增分類</h2>
			<div class="form-row">
				<input bind:value={newName} placeholder="分類名稱（必填）" />
				<input bind:value={newIcon} placeholder="圖示 emoji（選填）" maxlength="2" />
				<input type="color" bind:value={newColor} title="顏色" />
				<button on:click={addCategory} disabled={adding}>
					{adding ? '新增中...' : '新增'}
				</button>
			</div>
			{#if addError}<p class="error">{addError}</p>{/if}
		</section>

		<section class="list">
			{#if categories.length === 0}
				<p>尚無分類，請先新增。</p>
			{:else}
				<ul>
					{#each categories as cat (cat.id)}
						<li>
							{#if editingId === cat.id}
								<div class="edit-row">
									<input bind:value={editName} placeholder="名稱" />
									<input bind:value={editIcon} placeholder="emoji" maxlength="2" />
									<input type="color" bind:value={editColor} />
									<input type="number" bind:value={editSortOrder} placeholder="排序" style="width:60px" />
									<button on:click={() => saveEdit(cat.id)}>儲存</button>
									<button on:click={cancelEdit}>取消</button>
									{#if editError}<span class="error">{editError}</span>{/if}
								</div>
							{:else}
								<span class="cat-icon">{cat.icon || '📦'}</span>
								<span class="cat-name" style="color:{cat.color || 'inherit'}">{cat.name}</span>
								<button on:click={() => startEdit(cat)}>編輯</button>
								<button class="danger" on:click={() => deleteCategory(cat.id)}>刪除</button>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}
</main>

<style>
	.container { max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
	h1 { font-size: 1.5rem; margin-bottom: 1rem; }
	h2 { font-size: 1.1rem; margin-bottom: 0.5rem; }
	.form-row, .edit-row { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
	input[type="text"], input:not([type]) { flex: 1; padding: 0.4rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; }
	input[type="color"] { width: 36px; height: 32px; padding: 0; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; }
	input[type="number"] { padding: 0.4rem 0.4rem; border: 1px solid #ccc; border-radius: 4px; }
	button { padding: 0.4rem 0.8rem; border: none; border-radius: 4px; background: #4f46e5; color: white; cursor: pointer; }
	button:disabled { opacity: 0.6; }
	button.danger { background: #dc2626; }
	ul { list-style: none; padding: 0; }
	li { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; border-bottom: 1px solid #eee; }
	.cat-icon { font-size: 1.2rem; }
	.cat-name { flex: 1; font-weight: 500; }
	.error { color: #dc2626; font-size: 0.875rem; }
	.add-form { margin-bottom: 1.5rem; padding: 1rem; background: #f9fafb; border-radius: 8px; }
</style>
