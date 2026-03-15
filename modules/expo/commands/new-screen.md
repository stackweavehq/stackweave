# Scaffold New Screen

Generate a new expo-router screen with proper layout, types, SafeArea, and example content.

## Steps

1. Ask the user for the **route path** — e.g., `settings/notifications`, `(tabs)/explore`, `profile/[userId]`.

2. Determine the file path: `app/<route path>.tsx`.

3. Identify if the route is:
   - **Static**: `app/settings.tsx` → renders at `/settings`
   - **Dynamic**: `app/profile/[userId].tsx` → renders at `/profile/:userId`, access via `useLocalSearchParams()`
   - **Group**: `app/(tabs)/home.tsx` → renders at `/home` (group name stripped from URL)

4. Generate the screen file:

### Static Screen Template

```tsx
// app/settings/notifications.tsx
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotificationsScreen(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options=\{{ title: 'Notifications' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle=\{{ paddingBottom: insets.bottom + 24 }}
      >
        <Text style={styles.heading}>Notifications</Text>
        {/* Screen content here */}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
});
```

### Dynamic Route Screen Template

```tsx
// app/profile/[userId].tsx
import { View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function UserProfileScreen(): React.JSX.Element {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options=\{{ title: 'Profile' }} />
      <View style={[styles.container, \{{ paddingBottom: insets.bottom }}]}>
        <Text style={styles.heading}>User: {userId}</Text>
        {/* Fetch and display user data */}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    paddingTop: 24,
  },
});
```

5. If a `_layout.tsx` does not exist in the route directory, offer to create one:

```tsx
// app/settings/_layout.tsx
import { Stack } from 'expo-router';

export default function SettingsLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions=\{{
        headerStyle: \{{ backgroundColor: '#fff' }},
        headerTintColor: '#000',
      }}
    />
  );
}
```

6. Remind the user to:
   - Add navigation to the new screen from wherever it should be accessible
   - Test on both platforms ({{target_platforms}}) if using Platform.select or platform-specific code

## Notes

- All screens use `useSafeAreaInsets()` — never hardcode top/bottom padding.
- Configure the screen header via `<Stack.Screen options=\{{ ... }} />` inside the component, not in the layout file, to keep screen-specific options with the screen.
- For expo-router {{router_version}}, typed params use `useLocalSearchParams<{ paramName: string }>()`.
