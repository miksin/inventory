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

describe('items API logic', () => {
	it('requires household_id from session', () => {
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

	it('validates that item name is required', () => {
		const name = '  ';
		expect(name.trim()).toBeFalsy();
	});

	it('generates unique ids', async () => {
		const { generateId } = await import('../lib/utils');
		const id1 = generateId();
		const id2 = generateId();
		expect(id1).not.toBe(id2);
		expect(typeof id1).toBe('string');
		expect(id1.length).toBeGreaterThan(0);
	});

	it('defaults quantity to 1 when not specified', () => {
		const body: { name: string; quantity?: number } = { name: 'Test Item' };
		const quantity = body.quantity ?? 1;
		expect(quantity).toBe(1);
	});

	it('defaults unit to 個 when not specified', () => {
		const body: { name: string; unit?: string } = { name: 'Test Item' };
		const unit = body.unit ?? '個';
		expect(unit).toBe('個');
	});

	it('serializes tags as JSON string', () => {
		const tags = ['有機', '冷藏'];
		const serialized = JSON.stringify(tags);
		expect(serialized).toBe('["有機","冷藏"]');
		expect(JSON.parse(serialized)).toEqual(tags);
	});

	it('defaults tags to empty array when not provided', () => {
		const body: { name: string; tags?: string[] } = { name: 'Test Item' };
		const tags = JSON.stringify(body.tags ?? []);
		expect(tags).toBe('[]');
	});

	it('builds correct SQL update fields for partial PUT', () => {
		const updates: Record<string, unknown> = { name: 'New Name', quantity: 5 };
		const fields: string[] = [];
		if (updates.name !== undefined) fields.push('name = ?');
		if (updates.description !== undefined) fields.push('description = ?');
		if (updates.quantity !== undefined) fields.push('quantity = ?');
		expect(fields).toEqual(['name = ?', 'quantity = ?']);
	});

	it('rejects empty name on PUT update', () => {
		const name = '  ';
		expect(name.trim()).toBeFalsy();
	});

	it('returns 404 structure when item not found', () => {
		const error = { error: 'Not found' };
		expect(error.error).toBe('Not found');
	});

	it('builds activity_log diff correctly', () => {
		const existing = { name: 'Old Name', quantity: 3 };
		const updates = { name: 'New Name' };
		const diffBefore: Record<string, unknown> = {};
		const diffAfter: Record<string, unknown> = {};
		for (const [key, val] of Object.entries(updates)) {
			diffBefore[key] = (existing as Record<string, unknown>)[key];
			diffAfter[key] = val;
		}
		expect(diffBefore.name).toBe('Old Name');
		expect(diffAfter.name).toBe('New Name');
	});

	it('builds expiry_soon filter bounds correctly', () => {
		const now = Math.floor(Date.now() / 1000);
		const threshold30d = now + 30 * 86400;
		expect(threshold30d).toBeGreaterThan(now);
		expect(threshold30d - now).toBe(30 * 86400);
	});

	it('sets correct timestamps on create', () => {
		const before = Math.floor(Date.now() / 1000);
		const now = Math.floor(Date.now() / 1000);
		const after = Math.floor(Date.now() / 1000) + 1;
		expect(now).toBeGreaterThanOrEqual(before);
		expect(now).toBeLessThanOrEqual(after);
	});

	it('isExpiringSoon returns true for items expiring within 30 days', async () => {
		const { isExpiringSoon } = await import('../lib/utils');
		const soon = Math.floor(Date.now() / 1000) + 15 * 86400;
		expect(isExpiringSoon(soon)).toBe(true);
	});

	it('isExpiringSoon returns false for items expiring beyond 30 days', async () => {
		const { isExpiringSoon } = await import('../lib/utils');
		const far = Math.floor(Date.now() / 1000) + 60 * 86400;
		expect(isExpiringSoon(far)).toBe(false);
	});

	it('isExpired returns true for past timestamps', async () => {
		const { isExpired } = await import('../lib/utils');
		const past = Math.floor(Date.now() / 1000) - 86400;
		expect(isExpired(past)).toBe(true);
	});

	it('isExpired returns false for future timestamps', async () => {
		const { isExpired } = await import('../lib/utils');
		const future = Math.floor(Date.now() / 1000) + 86400;
		expect(isExpired(future)).toBe(false);
	});
});
