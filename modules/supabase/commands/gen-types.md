# Regenerate TypeScript Types

Regenerate the TypeScript type definitions from the live database schema.

## Steps

1. Ensure the Supabase CLI is authenticated:

```bash
supabase login
```

2. Generate types from the remote database:

```bash
supabase gen types typescript --project-id {{supabase_project_id}} > src/types/database.types.ts
```

3. If generating from a local development database:

```bash
supabase gen types typescript --local > src/types/database.types.ts
```

4. Check what changed:

```bash
git diff src/types/database.types.ts
```

Review the diff to confirm the changes match the migration you applied. Unexpected changes may indicate the migration did not apply correctly.

5. Stage the updated types file:

```bash
git add src/types/database.types.ts
```

## Using the Generated Types

```typescript
import type { Database, Tables, Enums } from './types/database.types';

// Table row types
type User = Tables<'users'>;
type Order = Tables<'orders'>;

// Insert types (all columns optional except NOT NULL without default)
type NewOrder = Database['public']['Tables']['orders']['Insert'];

// Update types (all columns optional)
type OrderUpdate = Database['public']['Tables']['orders']['Update'];

// Enum types
type OrderStatus = Enums<'order_status'>;

// Typed supabase client
import { createClient } from '@supabase/supabase-js';
const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Now queries are type-safe
const { data } = await supabase
  .from('orders')
  .select('id, status, total_cents')
  .eq('user_id', userId);
// data is typed as { id: string; status: string; total_cents: number }[] | null
```

## Automation

Add type generation to your post-migration script in `package.json`:

```json
{
  "scripts": {
    "db:types": "supabase gen types typescript --project-id {{supabase_project_id}} > src/types/database.types.ts",
    "db:migrate": "supabase db push && npm run db:types"
  }
}
```

## Notes

- Never manually edit `database.types.ts` — changes will be overwritten on the next generation.
- Always regenerate types after applying a migration.
- Commit the updated types alongside the migration that caused them.
- If types cannot be generated (CLI auth issue, project offline), do not use placeholder types — resolve the auth issue first.
