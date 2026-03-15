# Supabase RLS Guide

Row Level Security (RLS) is PostgreSQL's built-in mechanism for enforcing access control at the database layer. In Supabase, it is the primary line of defence — the `anon` key is public, so RLS policies are what prevent unauthorized access to your data.

---

## What RLS Is and Why It Matters

Without RLS, any client with the `anon` key can read every row in every table via the Supabase REST API or SDK. RLS adds a filter to every query based on who is making the request.

**Defence in depth**: even if your application has a bug that exposes a query to the wrong user, RLS at the database layer ensures that the query only returns rows the authenticated user is allowed to see. The database enforces access — not just the application.

---

## Basic Policy Patterns

### User-owned rows (most common pattern)

```sql
-- User can only read their own rows
CREATE POLICY "user_select_own" ON public.todos
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- User can only create rows with their own user_id
CREATE POLICY "user_insert_own" ON public.todos
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- User can only update their own rows
CREATE POLICY "user_update_own" ON public.todos
FOR UPDATE TO authenticated
USING (user_id = auth.uid())     -- which rows can be targeted
WITH CHECK (user_id = auth.uid()); -- what the row must look like after update

-- User can only delete their own rows
CREATE POLICY "user_delete_own" ON public.todos
FOR DELETE TO authenticated
USING (user_id = auth.uid());
```

### Public read, authenticated write

```sql
-- Anyone (including anonymous visitors) can read published posts
CREATE POLICY "public_read_published" ON public.posts
FOR SELECT TO anon, authenticated
USING (published = true);

-- Only authenticated users can create posts
CREATE POLICY "auth_insert" ON public.posts
FOR INSERT TO authenticated
WITH CHECK (author_id = auth.uid());
```

### Organisation-based access (multi-tenancy)

```sql
-- Users can read any row in their organisation
CREATE POLICY "org_member_select" ON public.invoices
FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT org_id
    FROM public.org_memberships
    WHERE user_id = auth.uid()
  )
);
```

### Role-based access via JWT claims

```sql
-- Only admin users can delete records
CREATE POLICY "admin_only_delete" ON public.products
FOR DELETE TO authenticated
USING (
  (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin'
);
```

---

## Testing RLS Locally

Use `psql` or the Supabase local SQL editor to simulate different roles:

```sql
-- Test as anonymous user
BEGIN;
SET LOCAL role TO anon;
SET LOCAL request.jwt.claims TO '{}';

SELECT * FROM public.todos; -- should return 0 rows

ROLLBACK;

-- Test as an authenticated user
BEGIN;
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "user-uuid-here", "role": "authenticated"}';

SELECT * FROM public.todos; -- should return only this user's rows

ROLLBACK;

-- Test as a specific user with custom claims
BEGIN;
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{
  "sub": "user-uuid-here",
  "role": "authenticated",
  "app_metadata": { "role": "admin" }
}';

DELETE FROM public.products WHERE id = 'some-id'; -- should succeed if admin policy exists

ROLLBACK;
```

Always `ROLLBACK` after tests — you do not want to accidentally commit changes made as another user.

---

## Common Pitfalls

### Forgetting to enable RLS

```sql
-- WRONG: table is fully open to anyone with the anon key
CREATE TABLE public.payments (...);

-- CORRECT: always enable RLS immediately after CREATE TABLE
CREATE TABLE public.payments (...);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
```

### Overly permissive policies

```sql
-- WRONG: "admin" claim is set by the client, not verified
CREATE POLICY "admin_only" ON public.settings
FOR DELETE TO authenticated
USING (current_setting('request.jwt.claims')::json->>'custom_claim' = 'admin');

-- CORRECT: use app_metadata (set server-side only, cannot be modified by the client)
CREATE POLICY "admin_only" ON public.settings
FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'admin');
```

### Missing USING vs WITH CHECK

- `USING`: filters which **existing** rows can be read/updated/deleted
- `WITH CHECK`: validates the **new** state of a row after an INSERT or UPDATE

For UPDATE policies, you almost always want both:

```sql
-- WRONG: user could update another user's row to change user_id to themselves
CREATE POLICY "update_own" ON public.notes
FOR UPDATE TO authenticated
WITH CHECK (user_id = auth.uid()); -- only checks new state

-- CORRECT: also restrict which rows can be targeted
CREATE POLICY "update_own" ON public.notes
FOR UPDATE TO authenticated
USING (user_id = auth.uid())       -- which rows can be selected for update
WITH CHECK (user_id = auth.uid()); -- what the row must look like after
```

### SECURITY DEFINER bypass

PostgreSQL functions marked `SECURITY DEFINER` run with the function owner's privileges and bypass RLS. Use them deliberately and document why:

```sql
-- Avoid unless necessary; document why RLS bypass is intentional
CREATE OR REPLACE FUNCTION get_all_users_admin()
RETURNS SETOF users
LANGUAGE sql
SECURITY DEFINER  -- runs as function owner, bypasses RLS
STABLE
AS $$
  SELECT * FROM public.users;
$$;
```

---

## Policies for storage.objects

File access is controlled via RLS on the `storage.objects` table:

```sql
-- Users can upload files only to their own folder
CREATE POLICY "user_upload_own" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can read files only from their own folder
CREATE POLICY "user_read_own" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Public readable files (e.g., product images)
CREATE POLICY "public_read_products" ON storage.objects
FOR SELECT TO anon, authenticated
USING (bucket_id = 'product-images');
```

---

## JWT Claims for Custom RBAC

To add custom claims to the JWT, create a Supabase Auth hook (Edge Function triggered on login):

```typescript
// supabase/functions/auth-hook/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const { user } = await req.json();

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Fetch role from database
  const { data: profile } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  return new Response(JSON.stringify({
    app_metadata: { role: profile?.role ?? 'member' },
  }));
});
```

Register the hook in Supabase Dashboard → Authentication → Hooks. The `app_metadata` field is server-controlled and cannot be modified by clients.
