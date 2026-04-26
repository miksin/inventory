
import type { PageServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: PageServerLoad = async ({ url, fetch }) => {
  const token = url.searchParams.get("token");
  if (!token) throw redirect(302, "/login");

  const res = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);
  // If verify redirects (302), SvelteKit follows it automatically via fetch
  // If it returns an error, show error page
  if (!res.ok) {
    return { error: "Invalid or expired magic link." };
  }
  // Should not reach here normally (verify redirects to / or /setup)
  throw redirect(302, "/");
};
