/**
 * Auth helpers for SvelteKit server routes.
 */

/**
 * Returns the session from locals, or throws a 401 Response if unauthenticated.
 */
export function requireSession(locals: App.Locals): { member_id: string; household_id: string } {
	if (!locals.session) {
		throw new Response(JSON.stringify({ error: 'Unauthorized' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	return locals.session;
}
