# Supabase Patterns

Project ID: **{{supabase_project_id}}**
Edge Functions: **{{use_edge_functions}}**
Auth providers: **{{auth_providers}}**
Realtime: **{{use_realtime}}**
Client framework: **{{client_framework}}**

---

## TypeScript Types

1. **Always generate TypeScript types from the database schema** — never write database types by hand. Generated types match the actual schema; handwritten types drift.

```bash
supabase gen types typescript --project-id {{supabase_project_id}} > src/types/database.types.ts
```

2. **Import only from the generated file** — do not create parallel type definitions:

```typescript
import type { Database } from '../types/database.types';
import type { Tables } from '../types/database.types';

type User = Tables<'users'>;
type Order = Tables<'orders'>;
```

3. **Re-generate types after every migration** — add this to your CI pipeline and post-migration checklist.

---

## Row Level Security (RLS)

4. **RLS is non-negotiable** — every table must have RLS enabled before it receives any data. A table without RLS is fully readable and writable by anyone with the `anon` key.

```sql
-- Always run this immediately after CREATE TABLE
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
```

5. **Never call `supabase.auth.admin` from client-side code** — the admin API bypasses RLS and requires the `service_role` key. If you need admin operations, use an Edge Function.

---

## Key Security

6. **Never expose the `service_role` key** in client code, mobile apps, or version control. Only the `anon` key belongs in client-accessible configuration.
7. **Store keys in environment variables**:

```bash
# .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

Never commit `.env` files. The `.env` file is gitignored; `.env.example` with placeholder values is committed.

---

## Migrations

8. **All schema changes via migrations** — never use the Supabase SQL editor for persistent changes. SQL editor changes are not tracked, are not reproducible, and can be overwritten by migrations.

```bash
# Create a new migration
supabase migration new add_orders_table

# Apply migrations locally
supabase db push

# Apply to remote
supabase db push --db-url "$DATABASE_URL"
```

9. **Migration files are immutable** — once a migration is applied to production, never edit it. Create a new migration to modify or correct it.

---

## Database Naming Conventions

10. **snake_case for tables, columns, and functions** — PostgreSQL is case-insensitive and lowercases unquoted identifiers. `camelCase` columns require quoting everywhere, which is error-prone.
11. **Plural table names** — `users` not `user`, `orders` not `order`, `audit_logs` not `audit_log`.
12. **Timestamps**: always include `created_at timestamptz DEFAULT now()` and `updated_at timestamptz DEFAULT now()` on every table. Use a trigger to keep `updated_at` current.

---

## Query Patterns

13. **Use postgres functions for multi-step queries** — if fetching data requires 3+ round trips from the client, write a PostgreSQL function and call it via `.rpc()`. This reduces latency and keeps business logic server-side.

```typescript
// instead of: fetch user → fetch their orders → fetch order items (3 round trips)
const { data } = await supabase.rpc('get_user_order_summary', { p_user_id: userId });
```

14. **supabase-js v2 patterns**: use the builder API, not deprecated methods.

```typescript
// good — v2 builder
const { data, error } = await supabase
  .from('orders')
  .select('id, status, items(product_id, quantity)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// bad — deprecated or v1 pattern
const { data } = await supabase.rpc('get_orders'); // only for actual DB functions
```

---

## Edge Functions

15. **Use Edge Functions for operations that require `service_role`** or external API calls — when `{{use_edge_functions}}` is true. Edge Functions run on Deno Deploy with access to secrets.

```bash
# Create a new Edge Function
supabase functions new send-welcome-email

# Run locally
supabase functions serve

# Deploy
supabase functions deploy send-welcome-email
```

16. **Never call external payment APIs, email services, or webhooks from the client** — do it in an Edge Function where credentials are server-side secrets.

---

## Auth

17. **Use `@supabase/auth-helpers-{{client_framework}}`** — not the base `@supabase/supabase-js` session management. The helpers handle cookie-based sessions, server-side rendering, and token refresh.
18. **Configured auth providers for this project**: {{auth_providers}}. Only enable providers that are listed here — extra providers in Supabase dashboard settings should be disabled.

---

## Realtime

19. **Always unsubscribe in cleanup functions** when using Realtime — failing to unsubscribe causes memory leaks and multiple subscription callbacks for the same event.

When `{{use_realtime}}` is true:

```typescript
// React example
useEffect(() => {
  const channel = supabase
    .channel('orders-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
      (payload) => handleChange(payload),
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
```

---

## Storage

20. **Never make buckets fully public** — set bucket policies via RLS on the `storage.objects` table. Even "public" read access should be expressed as an RLS policy, not a blanket public bucket, so you can audit and modify access later.

```sql
-- Allow authenticated users to read files in their own folder
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```
