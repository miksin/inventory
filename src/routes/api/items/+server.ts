import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSession } from '$lib/server/auth';
import { generateId } from '$lib/utils';

export const GET: RequestHandler = async ({ url, locals }) => {
	const session = requireSession(locals);

	const category_id = url.searchParams.get('category_id');
	const search = url.searchParams.get('search');
	const expiry_soon = url.searchParams.get('expiry_soon') === '1';
	const low_stock = url.searchParams.get('low_stock') === '1';

	const now = Math.floor(Date.now() / 1000);
	const threshold30d = now + 30 * 86400;

	let query =
		'SELECT id, category_id, name, description, quantity, unit, low_stock_threshold, location, purchase_date, expiry_date, warranty_until, barcode, tags, added_by, updated_by, created_at, updated_at FROM items WHERE household_id = ?';
	const params: (string | number)[] = [session.household_id];

	if (category_id) {
		query += ' AND category_id = ?';
		params.push(category_id);
	}
	if (search) {
		query += ' AND (name LIKE ? OR description LIKE ? OR location LIKE ?)';
		const like = `%${search}%`;
		params.push(like, like, like);
	}
	if (expiry_soon) {
		query += ' AND expiry_date IS NOT NULL AND expiry_date > ? AND expiry_date <= ?';
		params.push(now, threshold30d);
	}
	if (low_stock) {
		query += ' AND low_stock_threshold IS NOT NULL AND quantity <= low_stock_threshold';
	}

	query += ' ORDER BY updated_at DESC';

	const stmt = locals.db.prepare(query);
	const result = await stmt.bind(...params).all();

	return json(result.results);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = requireSession(locals);
	const body = await request.json();

	const name: string = body.name?.trim();
	if (!name) {
		return json({ error: 'name is required' }, { status: 400 });
	}

	const id = generateId();
	const now = Math.floor(Date.now() / 1000);

	const item = {
		id,
		household_id: session.household_id,
		category_id: body.category_id ?? null,
		name,
		description: body.description ?? null,
		quantity: body.quantity ?? 1,
		unit: body.unit ?? '個',
		low_stock_threshold: body.low_stock_threshold ?? null,
		location: body.location ?? null,
		purchase_date: body.purchase_date ?? null,
		expiry_date: body.expiry_date ?? null,
		warranty_until: body.warranty_until ?? null,
		barcode: body.barcode ?? null,
		tags: JSON.stringify(body.tags ?? []),
		added_by: session.member_id,
		updated_by: session.member_id,
		created_at: now,
		updated_at: now
	};

	await locals.db
		.prepare(
			'INSERT INTO items (id, household_id, category_id, name, description, quantity, unit, low_stock_threshold, location, purchase_date, expiry_date, warranty_until, barcode, tags, added_by, updated_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(
			item.id,
			item.household_id,
			item.category_id,
			item.name,
			item.description,
			item.quantity,
			item.unit,
			item.low_stock_threshold,
			item.location,
			item.purchase_date,
			item.expiry_date,
			item.warranty_until,
			item.barcode,
			item.tags,
			item.added_by,
			item.updated_by,
			item.created_at,
			item.updated_at
		)
		.run();

	// activity_log
	const logId = generateId();
	await locals.db
		.prepare(
			'INSERT INTO activity_log (id, household_id, member_id, action, item_id, item_name, diff, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(logId, session.household_id, session.member_id, 'create', id, name, '{}', now)
		.run();

	return json({ ...item, tags: body.tags ?? [] }, { status: 201 });
};
