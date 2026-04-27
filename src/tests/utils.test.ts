import { describe, it, expect } from 'vitest';
import { generateId, generateInviteCode, formatDate, isExpiringSoon, isExpired } from '../lib/utils';

describe('generateId', () => {
	it('returns a non-empty string', () => {
		const id = generateId();
		expect(typeof id).toBe('string');
		expect(id.length).toBeGreaterThan(0);
	});

	it('returns unique IDs', () => {
		const ids = new Set(Array.from({ length: 100 }, generateId));
		expect(ids.size).toBe(100);
	});
});

describe('generateInviteCode', () => {
	it('returns a 6-character string', () => {
		const code = generateInviteCode();
		expect(code.length).toBe(6);
	});

	it('only contains valid characters', () => {
		const code = generateInviteCode();
		expect(code).toMatch(/^[A-Z2-9]{6}$/);
	});
});

describe('formatDate', () => {
	it('returns empty string for null', () => {
		expect(formatDate(null)).toBe('');
	});

	it('returns formatted date for a valid timestamp', () => {
		const ts = 1700000000; // 2023-11-14 approx
		const result = formatDate(ts);
		expect(typeof result).toBe('string');
		expect(result.length).toBeGreaterThan(0);
	});
});

describe('isExpiringSoon', () => {
	it('returns false for null', () => {
		expect(isExpiringSoon(null)).toBe(false);
	});

	it('returns true for date within 30 days', () => {
		const soon = Math.floor(Date.now() / 1000) + 15 * 86400;
		expect(isExpiringSoon(soon)).toBe(true);
	});

	it('returns false for date beyond 30 days', () => {
		const later = Math.floor(Date.now() / 1000) + 60 * 86400;
		expect(isExpiringSoon(later)).toBe(false);
	});
});

describe('isExpired', () => {
	it('returns false for null', () => {
		expect(isExpired(null)).toBe(false);
	});

	it('returns true for past date', () => {
		const past = Math.floor(Date.now() / 1000) - 86400;
		expect(isExpired(past)).toBe(true);
	});

	it('returns false for future date', () => {
		const future = Math.floor(Date.now() / 1000) + 86400;
		expect(isExpired(future)).toBe(false);
	});
});
