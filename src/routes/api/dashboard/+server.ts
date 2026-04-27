import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireSession } from '$lib/server/auth';

export const GET: RequestHandler = async ({ locals }) => {
	const session = requireSession(locals);

	const now = Math.floor(Date.now() / 1000);
	const threshold30d = now + 30 * 86400;

	// expiring_soon: items with expiry_date within next 30 days
	const expiringSoon = await locals.db
		.prepare(
			'SELECT id, name, quantity, unit, expiry_date FROM items WHERE household_id = ? AND expiry_date IS NOT NULL AND expiry_date > ? AND expiry_date <= ? ORDER BY expiry_date ASC'
		)
		.bind(session.household_id, now, threshold30d)
		.all();

	// low_stock: items where quantity <= low_stock_threshold
	const lowStock = await locals.db
		.prepare(
			'SELECT id, name, quantity, unit, low_stock_threshold FROM items WHERE household_id = ? AND low_stock_threshold IS NOT NULL AND quantity <= low_stock_threshold ORDER BY quantity ASC'
		)
		.bind(session.household_id)
		.all();

	// recent_activity: last 10 activity_log entries
	const recentActivity = await locals.db
		.prepare(
			'SELECT id, member_id, action, item_id, item_name, diff, created_at FROM activity_log WHERE household_id = ? ORDER BY created_at DESC LIMIT 10'
		)
		.bind(session.household_id)
		.all();

	return json({
		expiring_soon: expiringSoon.results,
		low_stock: lowStock.results,
		recent_activity: recentActivity.results
	});
};
