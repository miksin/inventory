
import type { RequestHandler } from "@sveltejs/kit";
import { json, error } from "@sveltejs/kit";
import { createMagicLink, sendMagicLinkEmail } from "$lib/server/auth";

export const POST: RequestHandler = async ({ request, platform }) => {
  if (!platform?.env) throw error(500, "Platform not available");
  const db = platform.env.DB;
  const resendApiKey = (platform.env as unknown as Record<string, string>).RESEND_API_KEY;
  const appUrl = (platform.env as unknown as Record<string, string>).APP_URL ?? "http://localhost:5173";

  const body = await request.json().catch(() => null);
  const email: unknown = body?.email;

  if (typeof email !== "string" || !email.includes("@")) {
    throw error(400, "Invalid email");
  }

  const token = await createMagicLink(db, email.toLowerCase().trim());

  if (resendApiKey) {
    await sendMagicLinkEmail(resendApiKey, email, token, appUrl);
  }
  // In dev (no RESEND_API_KEY), return token in response for testing
  const response: Record<string, unknown> = { message: "Magic link sent" };
  if (!resendApiKey) response.dev_token = token;

  return json(response);
};
