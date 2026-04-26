// See https://kit.svelte.dev/docs/types#app
// Cloudflare D1 and KV bindings

declare global {
    namespace App {
        // interface Error {}
        interface Locals {
            session?: {
                member_id: string;
                household_id: string;
            };
            db: D1Database;
            kv: {
                sessions: KVNamespace;
                cache: KVNamespace;
            };
        }
        // interface PageData {}
        interface Platform {
            env: {
                DB: D1Database;
                SESSIONS: KVNamespace;
                CACHE: KVNamespace;
            };
            context: {
                waitUntil(promise: Promise<unknown>): void;
            };
            caches: CacheStorage & { default: Cache };
        }
    }
}

export {};
