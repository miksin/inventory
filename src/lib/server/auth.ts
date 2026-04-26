
import { nanoid } from 'nanoid';

const MAGIC_LINK_EXPIRY_MINUTES = 15;
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionData {
  member_id: string;
  household_id: string;
  email: string;
  display_name: string;
}

export async function createMagicLink(
  db: D1Database,
  email: string,
  household_id?: string
): Promise<string> {
  const token = nanoid(40);
  const expires_at = Math.floor(Date.now() / 1000) + MAGIC_LINK_EXPIRY_MINUTES * 60;

  await db
    .prepare(
      `INSERT INTO magic_links (token, email, household_id, expires_at)
       VALUES (?, ?, ?, ?)`
    )
    .bind(token, email, household_id ?? null, expires_at)
    .run();

  return token;
}

export async function verifyMagicLink(
  db: D1Database,
  token: string
): Promise<{ email: string; household_id: string | null } | null> {
  const now = Math.floor(Date.now() / 1000);

  const row = await db
    .prepare(
      `SELECT email, household_id, expires_at, used_at
       FROM magic_links WHERE token = ?`
    )
    .bind(token)
    .first<{ email: string; household_id: string | null; expires_at: number; used_at: number | null }>();

  if (!row) return null;
  if (row.used_at) return null;
  if (row.expires_at < now) return null;

  await db
    .prepare(`UPDATE magic_links SET used_at = ? WHERE token = ?`)
    .bind(now, token)
    .run();

  return { email: row.email, household_id: row.household_id };
}

export async function createSession(
  kv: KVNamespace,
  data: SessionData
): Promise<string> {
  const sessionToken = nanoid(40);
  await kv.put(`session:${sessionToken}`, JSON.stringify(data), {
    expirationTtl: SESSION_TTL_SECONDS,
  });
  return sessionToken;
}

export async function getSession(
  kv: KVNamespace,
  sessionToken: string
): Promise<SessionData | null> {
  const raw = await kv.get(`session:${sessionToken}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export async function deleteSession(
  kv: KVNamespace,
  sessionToken: string
): Promise<void> {
  await kv.delete(`session:${sessionToken}`);
}

export async function sendMagicLinkEmail(
  resendApiKey: string,
  email: string,
  token: string,
  appUrl: string
): Promise<void> {
  const link = `${appUrl}/login/verify?token=${token}`;
  const body = JSON.stringify({
    from: `Family Inventory <noreply@${new URL(appUrl).hostname}>`,
    to: [email],
    subject: 'Your Magic Link',
    html: `<p>Click the link below to sign in. It expires in 15 minutes.</p>
           <p><a href="${link}">${link}</a></p>`,
    text: `Sign-in link (expires in 15 minutes): ${link}`,
  });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
}
