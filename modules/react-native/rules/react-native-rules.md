# React Native Rules

## Components

### Functional Components and Hooks Only

Do not write class components. All components must be functional and use React hooks.

```tsx
// bad
class MyScreen extends React.Component { ... }

// good
function MyScreen(): React.JSX.Element { ... }
```

### StyleSheet.create for All Styles

Never use inline style objects. All styles must be defined with `StyleSheet.create`.
This improves performance (styles are validated and sent to native once) and keeps JSX readable.

```tsx
// bad
<View style={inlineStyleObject}>

// good
const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 16 },
});
<View style={styles.container}>
```

## Platform-Specific Code

### Platform-Specific Files

For substantial platform differences, use platform-specific file extensions:
- `MyComponent.ios.tsx`
- `MyComponent.android.tsx`
- `MyComponent.tsx` (shared fallback)

For small differences, use `Platform.select` or `Platform.OS` inline.

```ts
const hitSlop = Platform.select({ ios: 8, android: 12, default: 10 });
```

## Navigation

- Use **React Navigation** as the sole navigation library.
- Define typed navigation params using a root param list type.
- Never use `navigation.navigate` with untyped string literals — always use typed route names.

```ts
type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
};
```

## Native Modules

- Avoid bridged native modules when a JS/React Native alternative exists.
- If a native module is required, wrap it in a typed service layer and never call it directly from components.
- Document why the native module is necessary in a comment above the import.

## Performance

- Use `React.memo` for pure list item components.
- Avoid creating new object/array references inside render; derive values with `useMemo` / `useCallback`.
- Use `FlatList` or `FlashList` instead of mapping inside a `ScrollView` for long lists.
