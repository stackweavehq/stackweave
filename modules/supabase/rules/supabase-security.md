# Supabase Security Rules

Security in Supabase is primarily enforced through Row Level Security (RLS) policies at the database layer. These rules apply to every table and every API interaction.

---

## New Table Checklist

Every `CREATE TABLE` statement must immediately be followed by:

1. `ALTER TABLE <table> ENABLE ROW LEVEL SECURITY;`
2. A SELECT policy (or explicit decision to have no public read access)
3. An INSERT policy (or explicit decision to disallow inserts)
4. An UPDATE policy (or explicit decision to disallow updates)
5. A DELETE policy (or explicit decision to disallow deletes)

A table with RLS enabled but no policies is **fully restricted** (no operations succeed). A table without RLS enabled is **fully open** (anyone with the anon key can read and write). Never leave a table in the "no RLS" state.

---

## RLS Policy Patterns

### User-owned rows

```sql
-- Users can only see their own rows
CREATE POLICY "select_own" ON public.notes
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Users can only insert rows with their own user_id
CREATE POLICY "insert_own" ON public.notes
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update only their own rows
CREATE POLICY "update_own" ON public.notes
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete only their own rows
CREATE POLICY "delete_own" ON public.notes
FOR DELETE TO authenticated
USING (user_id = auth.uid());
```

### RBAC via JWT claims

Custom roles set in the `app_metadata` JWT claim:

```sql
-- Only users with the 'admin' role can delete
CREATE POLICY "admin_delete" ON public.products
FOR DELETE TO authenticated
USING (auth.jwt() ->> 'role' = 'admin');
```

Set the role in an Edge Function using the admin client:
```typescript
await adminClient.auth.admin.updateUserById(userId, {
  app_metadata: { role: 'admin' },
});
```

### Organisation-based access

```sql
-- Users can see rows belonging to their organisation
CREATE POLICY "org_select" ON public.invoices
FOR SELECT TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
  )
);
```

---

## SECURITY DEFINER Functions

1. **Never use `SECURITY DEFINER` without explicit review** — a `SECURITY DEFINER` function runs with the privileges of the function owner (usually `postgres`), bypassing RLS entirely. Every `SECURITY DEFINER` function must be documented with why it is necessary.
2. If a `SECURITY DEFINER` function is required, call it only from Edge Functions, not directly from client-side code.

---

## JWT and Session Handling

3. **Never log or store Supabase JWTs** — they contain the user's identity and role. Treat them as passwords.
4. **Use `supabase.auth.getSession()`** for reading the current session in client code — it reads from the local cache without a network request.
5. **Use `supabase.auth.getUser()`** only when you need server-side verification — it makes a network request to validate the JWT with Supabase Auth. Use this in Edge Functions and server-side routes where you cannot trust the client.

```typescript
// client-side (fast, cached)
const { data: { session } } = await supabase.auth.getSession();

// server-side (verified, slower)
const { data: { user } } = await supabase.auth.getUser(jwt);
```

---

## Environment Variables

6. Required environment variables — these must exist in all environments:

```
SUPABASE_URL=https://{{supabase_project_id}}.supabase.co
SUPABASE_ANON_KEY=<anon key — safe for clients>
```

Only in server/Edge Function environments:
```
SUPABASE_SERVICE_ROLE_KEY=<never expose to clients>
```

7. **Validate at startup** — check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set when the application initialises. Fail immediately with a clear error message rather than failing silently later.

---

## Local Testing of RLS Policies

Test policies locally using `psql` or the Supabase SQL editor (local dev only):

```sql
-- Simulate the anonymous role
SET role anon;
SELECT * FROM public.profiles; -- should return 0 rows if policy requires auth

-- Simulate an authenticated user
SET role authenticated;
SET request.jwt.claims TO '{"sub": "user-uuid-here", "role": "authenticated"}';
SELECT * FROM public.profiles; -- should return only the user's own profile

-- Reset to postgres superuser
RESET role;
```

Run these tests after writing every new policy to confirm correct behaviour before applying to production.
