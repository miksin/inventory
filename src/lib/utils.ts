import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 21);

export function generateId(): string {
	return nanoid();
}

export function generateInviteCode(): string {
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	return customAlphabet(alphabet, 6)();
}

export function formatDate(timestamp: number | null | undefined): string {
	if (!timestamp) return '';
	return new Date(timestamp * 1000).toLocaleDateString('zh-TW');
}

export function isExpiringSoon(expiryDate: number | null | undefined, days = 30): boolean {
	if (!expiryDate) return false;
	const now = Math.floor(Date.now() / 1000);
	const threshold = now + days * 86400;
	return expiryDate <= threshold && expiryDate > now;
}

export function isExpired(expiryDate: number | null | undefined): boolean {
	if (!expiryDate) return false;
	return expiryDate <= Math.floor(Date.now() / 1000);
}
