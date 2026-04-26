
import type { RequestHandler } from "@sveltejs/kit";
import { redirect, error } from "@sveltejs/kit";
import { verifyMagicLink, createSession } from "$lib/server/auth";
import { nanoid } from "nanoid";

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
  if (!platform?.env) throw error(500, "Platform not available");
  const db = platform.env.DB;
  const kv = platform.env.SESSIONS;

  const token = url.searchParams.get("token");
  if (!token) throw error(400, "Missing token");

  const verified = await verifyMagicLink(db, token);
  if (!verified) throw error(400, "Invalid or expired token");

  const { email } = verified;

  // Look up member by email
  let member = await db
    .prepare("SELECT id, household_id, display_name FROM members WHERE email = ? LIMIT 1")
    .bind(email)
    .first<{ id: string; household_id: string; display_name: string }>();

  if (!member) {
    // Auto-create member if first login (no household yet — redirect to /setup)
    const memberId = nanoid();
    const now = Math.floor(Date.now() / 1000);
    await db
      .prepare(
        "INSERT INTO members (id, household_id, email, display_name, role, created_at) VALUES (?, '', ?, ?, 'owner', ?)"
      )
      .bind(memberId, email, email.split("@")[0], now)
      .run();

    const sessionToken = await createSession(kv, {
      member_id: memberId,
      household_id: "",
      email,
      display_name: email.split("@")[0],
    });
    cookies.set("session_token", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    throw redirect(302, "/setup");
  }

  const sessionToken = await createSession(kv, {
    member_id: member.id,
    household_id: member.household_id,
    email,
    display_name: member.display_name,
  });

  cookies.set("session_token", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  throw redirect(302, "/");
};
