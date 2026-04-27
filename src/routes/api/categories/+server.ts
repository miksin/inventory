import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSession } from '$lib/server/auth';
import { generateId } from '$lib/utils';

export const GET: RequestHandler = async ({ locals }) => {
	const session = requireSession(locals);

	const result = await locals.db
		.prepare(
			'SELECT id, name, icon, color, sort_order FROM categories WHERE household_id = ? ORDER BY sort_order ASC, name ASC'
		)
		.bind(session.household_id)
		.all();

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
	const icon: string = body.icon ?? '';
	const color: string = body.color ?? '';
	const sort_order: number = body.sort_order ?? 0;

	await locals.db
		.prepare(
			'INSERT INTO categories (id, household_id, name, icon, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
		)
		.bind(id, session.household_id, name, icon, color, sort_order)
		.run();

	return json({ id, name, icon, color, sort_order }, { status: 201 });
};
