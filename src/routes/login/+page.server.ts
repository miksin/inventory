
import type { Actions } from "@sveltejs/kit";
import { fail } from "@sveltejs/kit";

export const actions: Actions = {
  default: async ({ request, fetch }) => {
    const data = await request.formData();
    const email = data.get("email");

    if (typeof email !== "string" || !email.includes("@")) {
      return fail(400, { error: "Invalid email address." });
    }

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json();

      if (!res.ok) return fail(res.status, { error: body?.message ?? "Failed to send magic link." });

      return { success: true, dev_token: body.dev_token ?? null };
    } catch (e) {
      return fail(500, { error: "Unexpected error. Please try again." });
    }
  },
};
