// See https://kit.svelte.dev/docs/types#app

import type { Database } from 'your-d1-types';

declare global {
    namespace App {
        // interface Error {}
        interface Locals {
            session?: {
                member_id: string;
                household_id: string;
            };
            db: Database;
            kv: {
                sessions: KVNamespace;
                cache: KVNamespace;
            }
        }
        // interface PageData {}
        // interface Platform {}
    }
}

export {};