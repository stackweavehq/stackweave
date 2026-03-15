# React Native Project Structure

## Recommended Directory Layout

Use a **feature-based** organization where each feature owns its screens, components, hooks, and services.

```
src/
  app/                    # App-level setup
    App.tsx               # Root component, providers, navigation container
    navigation/           # Navigator definitions
      RootNavigator.tsx
      TabNavigator.tsx
      linking.ts          # Deep link configuration
  features/               # Feature modules
    auth/
      screens/
        LoginScreen.tsx
        RegisterScreen.tsx
      components/
        LoginForm.tsx
        SocialAuthButton.tsx
      hooks/
        useAuth.ts
      services/
        authApi.ts
      types.ts
    profile/
      screens/
        ProfileScreen.tsx
        EditProfileScreen.tsx
      components/
        Avatar.tsx
      hooks/
        useProfile.ts
  shared/                 # Shared across features
    components/           # Reusable UI components
      Button.tsx
      TextInput.tsx
      LoadingSpinner.tsx
    hooks/                # Shared hooks
      useDebounce.ts
      useAppState.ts
    services/             # API clients, storage
      api.ts
      storage.ts
    utils/                # Pure utility functions
      formatting.ts
      validation.ts
    constants/            # App-wide constants
      colors.ts
      spacing.ts
      typography.ts
    types/                # Shared TypeScript types
      navigation.ts
      api.ts
  assets/                 # Images, fonts, animations
    images/
    fonts/
    animations/
```

## Key Principles

### Feature Isolation

Each feature directory should be as self-contained as possible:
- A feature can import from `shared/` but never from another feature.
- If two features need the same component, move it to `shared/components/`.
- Each feature has its own `types.ts` for feature-specific types.

### Barrel Exports

Use `index.ts` files to create clean public APIs for each feature:

```ts
// src/features/auth/index.ts
export { LoginScreen } from './screens/LoginScreen';
export { RegisterScreen } from './screens/RegisterScreen';
export { useAuth } from './hooks/useAuth';
```

### Screen vs Component

- **Screens** are full-page components connected to navigation. They live in `screens/`.
- **Components** are reusable UI building blocks. They live in `components/`.
- Screens compose components but components never import screens.

### Navigation Structure

Define all navigators in `src/app/navigation/`:

```tsx
// src/app/navigation/RootNavigator.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../../features/auth';
import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated } = useAuth();
  return (
    <Stack.Navigator>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
```

## Cross-Platform Code Sharing

### Platform Files

For components with significant platform differences:

```
shared/components/
  DatePicker/
    DatePicker.ios.tsx      # iOS-specific implementation
    DatePicker.android.tsx  # Android-specific implementation
    index.tsx               # Re-export (Metro resolves platform automatically)
    types.ts                # Shared props type
```

### Shared Logic

Extract platform-agnostic logic into hooks or utilities:

```tsx
// Hook contains shared logic
function useDatePicker() {
  const [date, setDate] = useState(new Date());
  const validate = useCallback((d: Date) => d > new Date(), []);
  return { date, setDate, validate };
}

// Platform files only handle native UI
// DatePicker.ios.tsx uses the hook + iOS DateTimePicker
// DatePicker.android.tsx uses the hook + Android DatePickerDialog
```

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Screens | PascalCase + `Screen` suffix | `ProfileScreen.tsx` |
| Components | PascalCase | `Avatar.tsx` |
| Hooks | camelCase with `use` prefix | `useAuth.ts` |
| Services | camelCase | `authApi.ts` |
| Utils | camelCase | `formatting.ts` |
| Types | PascalCase | `types.ts` |
| Constants | camelCase file, UPPER_SNAKE values | `colors.ts` → `PRIMARY_BLUE` |
