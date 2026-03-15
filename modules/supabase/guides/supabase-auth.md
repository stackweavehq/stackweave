# Supabase Auth Guide

Auth patterns differ by framework. This guide covers the configured providers ({{auth_providers}}) and the {{client_framework}} integration.

---

## Configured Auth Providers

This project supports: **{{auth_providers}}**

Enable only the providers listed above in the Supabase Dashboard → Authentication → Providers. Disable all others to reduce attack surface.

This project uses **{{client_framework}}** — refer to the matching section below.

---

## React (`@supabase/auth-helpers-react`)

### Setup

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

export const supabase = createClient<Database>(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!,
);
```

```tsx
// src/main.tsx
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from './lib/supabase';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <SessionContextProvider supabaseClient={supabase}>
    <App />
  </SessionContextProvider>
);
```

### Hooks

```typescript
import { useUser, useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

function Profile(): React.JSX.Element {
  const user = useUser();       // User | null
  const session = useSession(); // Session | null
  const supabase = useSupabaseClient<Database>();

  if (!user) return <LoginPage />;
  return <div>{user.email}</div>;
}
```

### Protected Routes

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }): React.JSX.Element {
  const session = useSession();
  if (session === null) return <Navigate to="/login" replace />;
  if (session === undefined) return <LoadingSpinner />; // still loading
  return <>{children}</>;
}
```

---

## React Native / Expo (`@supabase/supabase-js` with AsyncStorage)

### Session Persistence with AsyncStorage

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '../types/database.types';

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // disable for React Native
    },
  }
);
```

### Using expo-secure-store for Tokens (more secure than AsyncStorage)

```typescript
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient<Database>(url, anonKey, {
  auth: { storage: ExpoSecureStoreAdapter, ... },
});
```

### Deep Link OAuth Callback

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export default function RootLayout(): React.JSX.Element {
  useEffect(() => {
    // Handle OAuth redirect URL
    const subscription = Linking.addEventListener('url', ({ url }) => {
      supabase.auth.getSessionFromUrl(url as string);
    });
    return () => subscription.remove();
  }, []);

  // ...
}
```

In `app.config.ts`, set the redirect URL scheme for your app:
```typescript
export default {
  scheme: 'your-app-scheme', // replace with your app's URL scheme
  // ...
};
```

In Supabase Dashboard → Authentication → URL Configuration, add:
```
your-app-scheme://auth/callback
```

---

## Server-Side (Next.js App Router)

### Setup

```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '../types/database.types';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
}
```

### Protected Page

```typescript
// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '../../lib/supabase/server';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return <div>Welcome, {user.email}</div>;
}
```

---

## Auth State Change Listener

Always clean up auth state listeners to prevent memory leaks:

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_OUT') {
        // Clear local state, redirect to login
        queryClient.clear();
        router.replace('/login');
      }
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## OAuth Login

```typescript
// Google OAuth — web (react, next, vue)
async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });
  if (error) console.error('OAuth error', error);
}

// Google OAuth — react-native (use the deep link scheme from app.config.ts)
async function signInWithGoogle(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'your-app-scheme://auth/callback',
    },
  });
}
```
