# Expo Performance Rules

Performance in React Native is different from the web — the JS thread and UI thread are separate, and dropping frames is immediately visible to users.

---

## Images

1. **Always provide `contentFit` and `transition`** on `expo-image` — without `transition`, image loads cause jarring layout shifts.
2. **Use blurhash placeholders** for images loaded from a network — they render instantly from a compact hash while the real image loads.
3. **Size images correctly** — do not load a 2000×2000 image to display it at 100×100. Use image transformation APIs (CDN params, `expo-image-manipulator`) to request appropriately sized images.

---

## Lists

4. **Use `FlashList` from `@shopify/flash-list` instead of `FlatList`** for any list with more than ~20 items. FlashList recycles cell components like a true recycler view, dramatically reducing memory and frame drops.

```tsx
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={items}
  renderItem={({ item }) => <ItemRow item={item} />}
  estimatedItemSize={72}
  keyExtractor={(item) => item.id}
/>
```

5. **`estimatedItemSize` must be close to the actual item height** — FlashList uses it to pre-allocate layout space. A large discrepancy causes layout jitter.

---

## Memoization

6. **`useMemo` for expensive computed values** — wrap computations that run on every render and involve non-trivial work (sorting, filtering large arrays, deriving chart data).

```tsx
const sortedItems = useMemo(
  () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
  [items],
);
```

7. **`useCallback` for callbacks passed to child components** — without `useCallback`, a new function reference is created on every render, breaking `React.memo` optimization on children.

```tsx
const handlePress = useCallback(() => {
  onSelect(item.id);
}, [item.id, onSelect]);
```

8. **`React.memo` for pure list item components** — wrap components that receive the same props frequently and produce the same output. Only memoize when profiling confirms re-renders are a problem.

---

## Lazy Loading

9. **Lazy load screens not in the initial tab bar** — expo-router does this automatically for file-based routes not in the initial render. Do not eagerly import screens that are only reachable through navigation.
10. **Defer heavy SDK imports** — if a library is only needed on one screen, import it dynamically or inside the component that uses it rather than at the module top level.

---

## Animations

11. **Use `react-native-reanimated` for all animations** — the Animated API runs on the JS thread, causing dropped frames during JS work. Reanimated runs animations on the UI thread.

```tsx
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';

const offset = useSharedValue(0);
const animatedStyles = useAnimatedStyle(() => ({
  transform: [{ translateX: offset.value }],
}));

// trigger animation
offset.value = withSpring(100);
```

12. **Avoid `useNativeDriver: false`** in the legacy Animated API — it runs on the JS thread and drops frames. Either use `useNativeDriver: true` or migrate to Reanimated.

---

## Render Avoidance

13. **Avoid anonymous functions in JSX props** — they create new references on every render.

```tsx
// bad — new function on every render, breaks React.memo on ListItem
<FlatList renderItem={({ item }) => <ListItem item={item} />} />

// good — stable reference
const renderItem = useCallback(
  ({ item }: { item: Item }) => <ListItem item={item} />,
  [],
);
<FlashList renderItem={renderItem} />
```

14. **Avoid creating objects inline in JSX** — `style=\{{ margin: 8 }}` creates a new object reference each render. Move to `StyleSheet.create` or `useMemo`.

---

## Profiling

15. **Use the Expo DevTools Profiler and Flipper** to identify actual performance bottlenecks before optimizing. Premature memoization adds complexity without benefit. Optimize what profiling reveals, not what you guess is slow.
