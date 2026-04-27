import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSession } from '$lib/server/auth';

interface MemberRow {
	id: string;
	display_name: string;
	email: string;
	role: string;
	created_at: number;
}

export const GET: RequestHandler = async ({ locals }) => {
	const session = requireSession(locals);

	if (!session.household_id) {
		return json({ error: 'Not in a household' }, { status: 404 });
	}

	const result = await locals.db
		.prepare(
			'SELECT id, display_name, email, role, created_at FROM members WHERE household_id = ? ORDER BY created_at ASC'
		)
		.bind(session.household_id)
		.all<MemberRow>();

	return json({ members: result.results });
};
