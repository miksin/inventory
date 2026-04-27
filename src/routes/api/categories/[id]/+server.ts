import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSession } from '$lib/server/auth';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const session = requireSession(locals);
	const { id } = params;

	// Verify category belongs to member's household
	const existing = await locals.db
		.prepare('SELECT id FROM categories WHERE id = ? AND household_id = ?')
		.bind(id, session.household_id)
		.first();

	if (!existing) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	const body = await request.json();
	const fields: string[] = [];
	const values: unknown[] = [];

	if (body.name !== undefined) {
		const name = body.name.trim();
		if (!name) return json({ error: 'name cannot be empty' }, { status: 400 });
		fields.push('name = ?');
		values.push(name);
	}
	if (body.icon !== undefined) { fields.push('icon = ?'); values.push(body.icon); }
	if (body.color !== undefined) { fields.push('color = ?'); values.push(body.color); }
	if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order); }

	if (fields.length === 0) {
		return json({ error: 'No fields to update' }, { status: 400 });
	}

	values.push(id);
	await locals.db
		.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`)
		.bind(...values)
		.run();

	const updated = await locals.db
		.prepare('SELECT id, name, icon, color, sort_order FROM categories WHERE id = ?')
		.bind(id)
		.first();

	return json(updated);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	const session = requireSession(locals);
	const { id } = params;

	const existing = await locals.db
		.prepare('SELECT id FROM categories WHERE id = ? AND household_id = ?')
		.bind(id, session.household_id)
		.first();

	if (!existing) {
		return json({ error: 'Category not found' }, { status: 404 });
	}

	await locals.db.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

	return new Response(null, { status: 204 });
};
