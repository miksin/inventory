
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMagicLink, verifyMagicLink, createSession, getSession, deleteSession } from "$lib/server/auth";

// ---- Mock D1Database ----
function makeD1Mock() {
  const store: Record<string, Record<string, unknown>> = {};

  return {
    store,
    prepare(sql: string) {
      let boundParams: unknown[] = [];
      const stmt = {
        bind(...args: unknown[]) {
          boundParams = args;
          return stmt;
        },
        async run() {
          if (sql.includes("INSERT INTO magic_links")) {
            const [token, email, household_id, expires_at] = boundParams as [string, string, string | null, number];
            store[token] = { token, email, household_id, expires_at, used_at: null };
          }
          if (sql.includes("UPDATE magic_links SET used_at")) {
            const [used_at, token] = boundParams as [number, string];
            if (store[token]) (store[token] as Record<string, unknown>).used_at = used_at;
          }
          if (sql.includes("INSERT INTO members")) {
            const [id, , email] = boundParams as [string, string, string, string, string, number];
            store[`member:${id}`] = { id, email };
          }
        },
        async first<T>(): Promise<T | null> {
          if (sql.includes("FROM magic_links WHERE token")) {
            const [token] = boundParams as [string];
            return (store[token] ?? null) as T | null;
          }
          if (sql.includes("FROM members WHERE email")) {
            const [email] = boundParams as [string];
            const found = Object.values(store).find(
              (r) => r && (r as Record<string,unknown>).email === email
            );
            return (found ?? null) as T | null;
          }
          return null;
        },
      };
      return stmt;
    },
  } as unknown as D1Database & { store: Record<string, Record<string, unknown>> };
}

// ---- Mock KVNamespace ----
function makeKVMock(): KVNamespace {
  const store: Record<string, string> = {};
  return {
    async put(key: string, value: string) { store[key] = value; },
    async get(key: string) { return store[key] ?? null; },
    async delete(key: string) { delete store[key]; },
  } as unknown as KVNamespace;
}

// ---- Tests ----
describe("createMagicLink", () => {
  it("creates a token and stores it in D1", async () => {
    const db = makeD1Mock();
    const token = await createMagicLink(db, "test@example.com");
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(10);
    expect(db.store[token]).toBeTruthy();
    expect((db.store[token] as Record<string,unknown>).email).toBe("test@example.com");
  });
});

describe("verifyMagicLink", () => {
  it("returns email for a valid token", async () => {
    const db = makeD1Mock();
    const token = await createMagicLink(db, "user@example.com");
    const result = await verifyMagicLink(db, token);
    expect(result).not.toBeNull();
    expect(result?.email).toBe("user@example.com");
  });

  it("returns null for non-existent token", async () => {
    const db = makeD1Mock();
    const result = await verifyMagicLink(db, "nonexistent");
    expect(result).toBeNull();
  });

  it("returns null for already-used token", async () => {
    const db = makeD1Mock();
    const token = await createMagicLink(db, "user@example.com");
    await verifyMagicLink(db, token); // first use
    const second = await verifyMagicLink(db, token); // second use
    expect(second).toBeNull();
  });

  it("returns null for expired token", async () => {
    const db = makeD1Mock();
    const token = await createMagicLink(db, "user@example.com");
    // Manually expire
    (db.store[token] as Record<string,unknown>).expires_at = Math.floor(Date.now() / 1000) - 1;
    const result = await verifyMagicLink(db, token);
    expect(result).toBeNull();
  });
});

describe("createSession / getSession / deleteSession", () => {
  it("creates and retrieves a session", async () => {
    const kv = makeKVMock();
    const data = { member_id: "m1", household_id: "h1", email: "u@x.com", display_name: "User" };
    const token = await createSession(kv, data);
    expect(typeof token).toBe("string");
    const retrieved = await getSession(kv, token);
    expect(retrieved).toMatchObject(data);
  });

  it("returns null for missing session token", async () => {
    const kv = makeKVMock();
    const result = await getSession(kv, "missing");
    expect(result).toBeNull();
  });

  it("deletes a session", async () => {
    const kv = makeKVMock();
    const token = await createSession(kv, { member_id: "m2", household_id: "h2", email: "b@x.com", display_name: "B" });
    await deleteSession(kv, token);
    const result = await getSession(kv, token);
    expect(result).toBeNull();
  });
});
