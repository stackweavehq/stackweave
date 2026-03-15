# Create New Migration

Create and open a new Supabase migration file.

## Steps

1. Ask the user for a short descriptive name for the migration (snake_case, e.g., `add_orders_table`, `add_user_role_column`).

2. Run the migration create command:

```bash
supabase migration new <migration_name>
```

This creates a file at `supabase/migrations/<timestamp>_<migration_name>.sql`.

3. Open the generated file and add the SQL. Every migration that creates a new table must include the RLS checklist:

```sql
-- Example: new table migration
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  total_cents integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ⚠️ RLS Checklist — complete all of these:

-- 1. Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2. SELECT policy
CREATE POLICY "users_select_own_orders" ON public.orders
FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- 3. INSERT policy
CREATE POLICY "users_insert_own_orders" ON public.orders
FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- 4. UPDATE policy (if applicable)
CREATE POLICY "users_update_own_orders" ON public.orders
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. DELETE policy (if applicable)
CREATE POLICY "users_delete_own_orders" ON public.orders
FOR DELETE TO authenticated
USING (user_id = auth.uid());

-- 6. updated_at trigger
CREATE TRIGGER set_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');
```

4. Apply the migration locally to test it:

```bash
supabase db push
```

5. After applying, regenerate TypeScript types:

```bash
supabase gen types typescript --project-id {{supabase_project_id}} > src/types/database.types.ts
```

## RLS Checklist Reminder

For every new table:
- [ ] RLS enabled
- [ ] SELECT policy defined (or explicitly omitted with comment explaining why)
- [ ] INSERT policy defined
- [ ] UPDATE policy defined (if rows can be modified)
- [ ] DELETE policy defined (if rows can be deleted)
- [ ] `updated_at` trigger (if table has `updated_at` column)
- [ ] TypeScript types regenerated after migration applied

## Notes

- Never edit an existing migration file after it has been applied to any environment.
- If a migration has an error, create a corrective migration — do not delete and recreate.
- The `supabase/migrations/` directory is the source of truth for all schema changes.
