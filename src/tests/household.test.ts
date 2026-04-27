import { describe, it, expect, vi } from 'vitest';
import { requireSession } from '../lib/server/auth';

describe('requireSession', () => {
	it('returns session when present', () => {
		const locals = {
			session: { member_id: 'mem1', household_id: 'hh1' },
			db: {} as App.Locals['db'],
			kv: {} as App.Locals['kv']
		} satisfies App.Locals;

		const session = requireSession(locals);
		expect(session.member_id).toBe('mem1');
		expect(session.household_id).toBe('hh1');
	});

	it('throws a Response with 401 when session is missing', () => {
		const locals = {
			session: undefined,
			db: {} as App.Locals['db'],
			kv: {} as App.Locals['kv']
		} satisfies App.Locals;

		expect(() => requireSession(locals)).toThrow();

		try {
			requireSession(locals);
		} catch (e) {
			expect(e instanceof Response).toBe(true);
			const res = e as Response;
			expect(res.status).toBe(401);
		}
	});
});
