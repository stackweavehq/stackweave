## Supabase Infrastructure

This project uses **Supabase** for the backend: PostgreSQL database, auth, storage, and optionally Edge Functions and Realtime.

### Project Setup

| Setting | Value |
|---------|-------|
| Project ID | `{{supabase_project_id}}` |
| Auth providers | {{auth_providers}} |
| Edge Functions | {{use_edge_functions}} |
| Realtime | {{use_realtime}} |
| Client framework | {{client_framework}} |

### Key Patterns

- **Type safety**: always generate types with `supabase gen types typescript --project-id {{supabase_project_id}}` — never write DB types by hand
- **Schema changes**: always via `supabase migration new` — never the SQL editor
- **Naming**: snake_case tables and columns, plural table names

### RLS is Non-Negotiable

Every table **must** have RLS enabled. The anon key is public — RLS policies are the only thing preventing unauthorized data access. New table checklist:

1. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
2. SELECT, INSERT, UPDATE, DELETE policies
3. Regenerate TypeScript types

### Key Security Rules

- Only `SUPABASE_ANON_KEY` in client code — never `SUPABASE_SERVICE_ROLE_KEY`
- Never call `supabase.auth.admin` from client-side code
- Use Edge Functions for operations requiring the service role key
- `getSession()` for client-side (fast, cached), `getUser()` for server-side (verified)

### Auth

Use `@supabase/auth-helpers-{{client_framework}}` for session management — never manage tokens manually. Clean up all auth state listeners and Realtime subscriptions in component unmount/cleanup functions.
