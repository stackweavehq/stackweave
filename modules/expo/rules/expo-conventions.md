# Expo Conventions

Router version: **{{router_version}}**
Target platforms: **{{target_platforms}}**
EAS Build enabled: **{{use_eas}}**
Minimum Android SDK: **{{min_sdk_android}}**
Minimum iOS: **{{min_ios}}**

---

## Navigation: Expo Router {{router_version}}

1. **Always use expo-router {{router_version}}** for all navigation — do not install or use `@react-navigation/native` directly. Expo Router wraps React Navigation and adds file-based routing; using React Navigation directly bypasses the file-based router and causes link and deep link inconsistencies.

2. **File-based routing**: every file in the `app/` directory is a route. The URL structure mirrors the filesystem.

```
app/
├── _layout.tsx          # Root layout — SafeAreaProvider, auth gate, global providers
├── index.tsx            # Route: /
├── (auth)/
│   ├── _layout.tsx      # Auth group layout
│   ├── login.tsx        # Route: /login (not /(auth)/login)
│   └── register.tsx     # Route: /register
├── (tabs)/
│   ├── _layout.tsx      # Tab bar layout
│   ├── home.tsx         # Route: /home
│   └── profile.tsx      # Route: /profile
└── [id].tsx             # Dynamic route: /:id
```

3. **Route groups `(group)`**: use parentheses to create logical groupings without affecting the URL. `(auth)/login` renders at `/login`.

4. **`_layout.tsx` required** for any directory that contains routes. The layout defines the navigation container (Stack, Tabs, Drawer) and shared UI (headers, tab bars).

---

## Platform-Specific Code

5. **File-based platform splits**: for components with substantially different implementations per platform, use `.ios.tsx` and `.android.tsx` suffixes. React Native's module resolution will automatically pick the correct file.

```
components/
├── DatePicker.ios.tsx     # UIDatePicker
├── DatePicker.android.tsx # DatePickerAndroid
└── DatePicker.tsx         # Fallback (web, test)
```

6. **`Platform.select()`** for small differences — padding, font size, a single style property — where a separate file would be overkill.

```tsx
const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1 },
    android: { elevation: 4 },
  }),
});
```

---

## Image Loading

7. **Use `expo-image` instead of React Native's `Image` component**. `expo-image` provides disk + memory caching, progressive loading, blurhash placeholders, and `contentFit` (equivalent to CSS `object-fit`).

```tsx
import { Image } from 'expo-image';

<Image
  source=\{{ uri: user.avatarUrl }}
  style={styles.avatar}
  contentFit="cover"
  transition={200}
  placeholder={blurhash}
/>
```

---

## Media

8. **Use `expo-av`** for all audio and video playback. Do not install separate native AV libraries.

---

## Environment Variables

9. **Use `Constants.expoConfig.extra`** to access environment variables in app code. Define extras in `app.config.ts` and read them at runtime via the Constants API:

```typescript
// app.config.ts
export default ({ config }) => ({
  ...config,
  extra: {
    apiUrl: process.env.API_URL,
    supabaseKey: process.env.SUPABASE_ANON_KEY,
  },
});

// usage
import Constants from 'expo-constants';
const apiUrl = Constants.expoConfig!.extra!.apiUrl as string;
```

10. **Use `app.config.ts` (not `app.json`)** — TypeScript config allows environment-based configuration and dynamic values. `app.json` is static and cannot read environment variables at build time.

---

## OTA Updates

11. **expo-updates for OTA delivery** — check for updates when the app foregrounds:

```typescript
import * as Updates from 'expo-updates';

async function checkForUpdate(): Promise<void> {
  if (__DEV__) return; // skip in development
  const update = await Updates.checkForUpdateAsync();
  if (update.isAvailable) {
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  }
}
```

---

## Safe Area

12. **`SafeAreaProvider` at the root** — wrap the entire app in `<SafeAreaProvider>` in the root `_layout.tsx`.
13. **`useSafeAreaInsets()` in components** — never hardcode padding values for notches or home indicators. Use the `insets` from the hook.

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Header(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return <View style=\{{ paddingTop: insets.top + 16 }}>...</View>;
}
```

---

## Push Notifications

14. **Use `expo-notifications` only** for all push notification handling. Do not integrate Firebase Messaging or APNs directly — they bypass Expo's abstraction and complicate OTA delivery.

---

## Deep Linking

15. **Define the URL scheme in `app.config.ts`**:

```typescript
export default {
  scheme: 'myapp',
  // ...
};
```

16. **Handle deep links in root `_layout.tsx`** — expo-router handles routing automatically for links that match the `app/` structure. For custom schemes (e.g., OAuth callbacks), use `Linking.addEventListener`.

---

## Managed Workflow

17. **Never eject** — stay in the Expo managed workflow. Use [config plugins](https://docs.expo.dev/guides/config-plugins/) to add native code without ejecting.
18. If a native library requires a config plugin, add it to `app.config.ts` plugins array. If no config plugin exists, evaluate whether the library is necessary before considering ejecting.

---

## EAS Build and Distribution

19. **Use EAS Build for all distribution** when `{{use_eas}}` is true — local builds are only for development. EAS guarantees reproducible builds in a clean environment.
20. **Minimum SDK targets**: Android **{{min_sdk_android}}** (SDK {{min_sdk_android}}), iOS **{{min_ios}}**. Do not use APIs unavailable on these versions without runtime guards.
