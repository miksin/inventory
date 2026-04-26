
import type { Handle } from "@sveltejs/kit";
import { redirect } from "@sveltejs/kit";
import { getSession } from "$lib/server/auth";

const PUBLIC_PATHS = ["/login", "/login/verify", "/api/auth/magic-link", "/api/auth/verify"];

export const handle: Handle = async ({ event, resolve }) => {
  const { platform, cookies, url } = event;

  // Attach D1 and KV to locals if available
  if (platform?.env) {
    event.locals.db = platform.env.DB;
    event.locals.kv = {
      sessions: platform.env.SESSIONS,
      cache: platform.env.CACHE,
    };
  }

  const isPublic = PUBLIC_PATHS.some((p) => url.pathname.startsWith(p));

  const sessionToken = cookies.get("session_token");

  if (sessionToken && platform?.env?.SESSIONS) {
    const session = await getSession(platform.env.SESSIONS, sessionToken);
    if (session) {
      event.locals.session = {
        member_id: session.member_id,
        household_id: session.household_id,
      };
    }
  }

  if (!isPublic && !event.locals.session) {
    throw redirect(302, "/login");
  }

  return resolve(event);
};
