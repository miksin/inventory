
import type { RequestHandler } from "@sveltejs/kit";
import { json, redirect } from "@sveltejs/kit";
import { deleteSession } from "$lib/server/auth";

export const POST: RequestHandler = async ({ cookies, platform }) => {
  const sessionToken = cookies.get("session_token");
  if (sessionToken && platform?.env?.SESSIONS) {
    await deleteSession(platform.env.SESSIONS, sessionToken);
  }
  cookies.delete("session_token", { path: "/" });
  return json({ message: "Logged out" });
};
