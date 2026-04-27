import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSession } from '$lib/server/auth';
import { generateId } from '$lib/utils';

export const GET: RequestHandler = async ({ params, locals }) => {
	const session = requireSession(locals);

	const item = await locals.db
		.prepare(
			'SELECT id, category_id, name, description, quantity, unit, low_stock_threshold, location, purchase_date, expiry_date, warranty_until, barcode, tags, added_by, updated_by, created_at, updated_at FROM items WHERE id = ? AND household_id = ?'
		)
		.bind(params.id, session.household_id)
		.first();

	if (!item) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	return json({ ...item, tags: JSON.parse((item.tags as string) || '[]') });
};

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const session = requireSession(locals);
	const body = await request.json();

	const existing = await locals.db
		.prepare('SELECT * FROM items WHERE id = ? AND household_id = ?')
		.bind(params.id, session.household_id)
		.first();

	if (!existing) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	const name: string | undefined = body.name !== undefined ? body.name.trim() : undefined;
	if (name !== undefined && !name) {
		return json({ error: 'name cannot be empty' }, { status: 400 });
	}

	const now = Math.floor(Date.now() / 1000);
	const fields: string[] = [];
	const values: (string | number | null)[] = [];

	const updatable: Record<string, unknown> = {
		name,
		description: body.description,
		category_id: body.category_id,
		quantity: body.quantity,
		unit: body.unit,
		low_stock_threshold: body.low_stock_threshold,
		location: body.location,
		purchase_date: body.purchase_date,
		expiry_date: body.expiry_date,
		warranty_until: body.warranty_until,
		barcode: body.barcode,
		tags: body.tags !== undefined ? JSON.stringify(body.tags) : undefined
	};

	// Build diff for activity_log
	const diffBefore: Record<string, unknown> = {};
	const diffAfter: Record<string, unknown> = {};

	for (const [key, val] of Object.entries(updatable)) {
		if (val !== undefined) {
			fields.push(`${key} = ?`);
			values.push(val as string | number | null);
			diffBefore[key] = (existing as Record<string, unknown>)[key];
			diffAfter[key] = val;
		}
	}

	if (fields.length === 0) {
		return json({ error: 'No fields to update' }, { status: 400 });
	}

	fields.push('updated_by = ?', 'updated_at = ?');
	values.push(session.member_id, now);
	values.push(params.id, session.household_id);

	await locals.db
		.prepare(`UPDATE items SET ${fields.join(', ')} WHERE id = ? AND household_id = ?`)
		.bind(...values)
		.run();

	// activity_log
	const logId = generateId();
	const diff = JSON.stringify({ before: diffBefore, after: diffAfter });
	await locals.db
		.prepare(
			'INSERT INTO activity_log (id, household_id, member_id, action, item_id, item_name, diff, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(
			logId,
			session.household_id,
			session.member_id,
			'update',
			params.id,
			name ?? (existing.name as string),
			diff,
			now
		)
		.run();

	const updated = await locals.db
		.prepare('SELECT * FROM items WHERE id = ? AND household_id = ?')
		.bind(params.id, session.household_id)
		.first();

	return json({
		...updated,
		tags: JSON.parse(((updated as Record<string, unknown>).tags as string) || '[]')
	});
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const session = requireSession(locals);

	const existing = await locals.db
		.prepare('SELECT id, name FROM items WHERE id = ? AND household_id = ?')
		.bind(params.id, session.household_id)
		.first();

	if (!existing) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	await locals.db
		.prepare('DELETE FROM items WHERE id = ? AND household_id = ?')
		.bind(params.id, session.household_id)
		.run();

	// activity_log
	const now = Math.floor(Date.now() / 1000);
	const logId = generateId();
	await locals.db
		.prepare(
			'INSERT INTO activity_log (id, household_id, member_id, action, item_id, item_name, diff, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(
			logId,
			session.household_id,
			session.member_id,
			'delete',
			params.id,
			existing.name,
			'{}',
			now
		)
		.run();

	return new Response(null, { status: 204 });
};
