import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSession } from '$lib/server/auth';
import { generateId, generateInviteCode } from '$lib/utils';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = requireSession(locals);
	const body = await request.json();
	const name: string = body.name?.trim();
	if (!name) {
		return json({ error: 'name is required' }, { status: 400 });
	}

	const id = generateId();
	const invite_code = generateInviteCode();
	const now = Math.floor(Date.now() / 1000);

	await locals.db
		.prepare('INSERT INTO households (id, name, invite_code, created_at) VALUES (?, ?, ?, ?)')
		.bind(id, name, invite_code, now)
		.run();

	// Assign the current member to this household as owner
	await locals.db
		.prepare("UPDATE members SET household_id = ?, role = 'owner' WHERE id = ?")
		.bind(id, session.member_id)
		.run();

	return json({ id, name, invite_code });
};
