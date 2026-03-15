# React Native Rules

## 1. Functional Components Only

Do not write class components. All components must be functional and use React hooks.

```tsx
// bad
class MyScreen extends React.Component { ... }

// good
function MyScreen(): React.JSX.Element { ... }
```

## 2. StyleSheet.create for All Styles

Never use inline style objects. All styles must be defined with `StyleSheet.create`.
This improves performance (styles are validated and sent to native once) and keeps JSX readable.

```tsx
// bad
<View style={{ flexDirection: 'row', padding: 16 }}>

// good
const styles = StyleSheet.create({
  container: { flexDirection: 'row', padding: 16 },
});
<View style={styles.container}>
```

## 3. Platform-Specific Code

### Platform-Specific Files

For substantial platform differences, use platform-specific file extensions:
- `MyComponent.ios.tsx`
- `MyComponent.android.tsx`
- `MyComponent.tsx` (shared fallback)

For small differences, use `Platform.select` or `Platform.OS` inline.

```ts
const hitSlop = Platform.select({ ios: 8, android: 12, default: 10 });
```

### Platform.select Over Ternaries

Prefer `Platform.select` over `Platform.OS === 'ios' ?` ternaries for readability
and to support future platforms (e.g. web, visionOS).

## 4. Navigation

- Use **{{navigation_library}}** as the sole navigation library.
- Define typed navigation params using a root param list type.
- Never use `navigation.navigate` with untyped string literals — always use typed route names.
- Compose navigators: use stack for flow, tabs for top-level sections, drawer for side menus.

```ts
type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
};
```

### Deep Linking

Configure deep linking via the `linking` prop on `NavigationContainer`:

```ts
const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Home: '',
      Profile: 'user/:userId',
    },
  },
};
```

## 5. Lists and Scrolling

- Use `FlatList` or `@shopify/flash-list` (`FlashList`) for any list of 10+ items.
- Never map items inside a `ScrollView` for lists — this renders all items at once.
- Use `FlashList` for lists over 100 items for better performance.

```tsx
// bad — renders all items at once
<ScrollView>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</ScrollView>

// good — virtualized, renders only visible items
<FlatList
  data={items}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <ItemCard item={item} />}
/>
```

## 6. Image Optimization

- Use `react-native-fast-image` or `expo-image` instead of the built-in `Image` component for network images.
- Always specify image dimensions to avoid layout shifts.
- Use `resizeMode="cover"` or `contentFit="cover"` by default; choose explicitly.
- Use placeholder/blurhash for network images to avoid blank flashes.

```tsx
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: imageUrl, priority: FastImage.priority.normal }}
  style={{ width: 200, height: 200 }}
  resizeMode={FastImage.resizeMode.cover}
/>
```

## 7. Safe Area Handling

- Wrap the app root in `SafeAreaProvider` from `react-native-safe-area-context`.
- Use `useSafeAreaInsets()` in individual screens rather than wrapping every screen in `SafeAreaView`.
- Never hardcode status bar heights or notch insets.

```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function MyScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* content */}
    </View>
  );
}
```

## 8. Keyboard Avoidance

- Use `KeyboardAvoidingView` with `behavior="padding"` on iOS and `behavior="height"` on Android.
- For forms, consider `react-native-keyboard-aware-scroll-view` for automatic scroll-to-input.
- Always test keyboard behavior on both platforms with different keyboard types.

```tsx
<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  style={{ flex: 1 }}
>
  {/* form content */}
</KeyboardAvoidingView>
```

## 9. Accessibility

- Every interactive element must have `accessibilityLabel` and `accessibilityRole`.
- Use `accessibilityHint` for non-obvious actions.
- Images must have `accessibilityLabel` describing the content.
- Test with VoiceOver (iOS) and TalkBack (Android).

```tsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Submit order"
  accessibilityHint="Places your order and navigates to confirmation"
  onPress={handleSubmit}
>
  <Text>Submit</Text>
</TouchableOpacity>
```

## 10. Native Modules

- Avoid bridged native modules when a JS/React Native alternative exists.
- If a native module is required, wrap it in a typed service layer and never call it directly from components.
- Document why the native module is necessary in a comment above the import.

## 11. Performance

### Avoid Inline Closures in JSX Props

Do not create new functions or objects in render. Extract them or use `useCallback`/`useMemo`.

```tsx
// bad — new function created every render
<Button onPress={() => handlePress(id)} />

// good
const onPress = useCallback(() => handlePress(id), [id]);
<Button onPress={onPress} />
```

### Memoize List Items

Use `React.memo` for all list item components rendered by `FlatList`/`FlashList`.

```tsx
const ItemCard = React.memo(function ItemCard({ item }: Props) {
  return <View>...</View>;
});
```

### useMemo for Expensive Computations

Wrap expensive derived data in `useMemo` to avoid recomputing on every render.

```tsx
const sortedItems = useMemo(
  () => items.slice().sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);
```

### InteractionManager for Post-Animation Work

Defer heavy operations until after navigation animations complete.

```tsx
useEffect(() => {
  const task = InteractionManager.runAfterInteractions(() => {
    loadHeavyData();
  });
  return () => task.cancel();
}, []);
```

### Avoid Re-renders

- Use `React.memo` on pure components.
- Split context providers to avoid broad re-renders.
- Use {{state_management}} selectors to subscribe to only the state slices you need.
