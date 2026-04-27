import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSession } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = requireSession(locals);
	const body = await request.json();
	const invite_code: string = body.invite_code?.trim().toUpperCase();
	if (!invite_code) {
		return json({ error: 'invite_code is required' }, { status: 400 });
	}

	// Find household by invite code
	const household = await locals.db
		.prepare('SELECT id, name FROM households WHERE invite_code = ?')
		.bind(invite_code)
		.first<{ id: string; name: string }>();

	if (!household) {
		return json({ error: 'Invalid invite code' }, { status: 404 });
	}

	// Check member not already in a household
	const member = await locals.db
		.prepare('SELECT household_id FROM members WHERE id = ?')
		.bind(session.member_id)
		.first<{ household_id: string | null }>();

	if (member?.household_id) {
		return json({ error: 'Already in a household' }, { status: 409 });
	}

	await locals.db
		.prepare("UPDATE members SET household_id = ?, role = 'member' WHERE id = ?")
		.bind(household.id, session.member_id)
		.run();

	return json({ household_id: household.id, name: household.name });
};
