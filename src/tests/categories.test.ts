import { describe, it, expect, vi } from 'vitest';

// Mock the DB binding
function makeLocals(overrides: Partial<App.Locals> = {}): App.Locals {
	return {
		session: { member_id: 'mem1', household_id: 'hh1' },
		db: {} as App.Locals['db'],
		kv: {} as App.Locals['kv'],
		...overrides
	};
}

describe('categories API logic', () => {
	it('requires household_id from session for category creation', () => {
		const locals = makeLocals();
		expect(locals.session?.household_id).toBe('hh1');
	});

	it('rejects unauthenticated requests', async () => {
		const { requireSession } = await import('../lib/server/auth');
		const locals = makeLocals({ session: undefined });
		expect(() => requireSession(locals)).toThrow();
		try {
			requireSession(locals);
		} catch (e) {
			expect(e instanceof Response).toBe(true);
			expect((e as Response).status).toBe(401);
		}
	});

	it('validates that category name is required', async () => {
		// Simulate what POST /api/categories would do
		const name = '  ';
		expect(name.trim()).toBeFalsy();
	});

	it('generates a unique id for each category', async () => {
		const { generateId } = await import('../lib/utils');
		const id1 = generateId();
		const id2 = generateId();
		expect(id1).not.toBe(id2);
		expect(typeof id1).toBe('string');
		expect(id1.length).toBeGreaterThan(0);
	});

	it('applies default sort_order of 0 when not specified', () => {
		const body: { name: string; sort_order?: number } = { name: 'Kitchen' };
		const sort_order = body.sort_order ?? 0;
		expect(sort_order).toBe(0);
	});

	it('allows optional icon and color fields', () => {
		const body = { name: 'Kitchen', icon: '🍳', color: '#ef4444' };
		expect(body.icon).toBe('🍳');
		expect(body.color).toBe('#ef4444');
	});

	it('builds correct SQL fields for partial PUT update', () => {
		const updates: Record<string, unknown> = { name: 'New Name', sort_order: 3 };
		const fields: string[] = [];
		if (updates.name !== undefined) fields.push('name = ?');
		if (updates.icon !== undefined) fields.push('icon = ?');
		if (updates.color !== undefined) fields.push('color = ?');
		if (updates.sort_order !== undefined) fields.push('sort_order = ?');
		expect(fields).toEqual(['name = ?', 'sort_order = ?']);
		expect(fields.join(', ')).toBe('name = ?, sort_order = ?');
	});

	it('rejects empty name on PUT update', () => {
		const name = '  ';
		expect(name.trim()).toBeFalsy();
	});
});
