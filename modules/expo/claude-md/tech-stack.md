## Expo / React Native Stack

This project is a mobile app built with **Expo** and **Expo Router {{router_version}}**.

### Configuration

| Setting | Value |
|---------|-------|
| Router | Expo Router {{router_version}} |
| Platforms | {{target_platforms}} |
| EAS Build | {{use_eas}} |
| Min iOS | {{min_ios}} |
| Min Android SDK | {{min_sdk_android}} |

### Key Library Choices

| Library | Purpose |
|---------|---------|
| `expo-router` | File-based navigation — all screens in `app/` directory |
| `expo-image` | Image loading with caching, blurhash placeholders, `contentFit` |
| `expo-av` | Audio and video playback |
| `expo-notifications` | Push notification handling |
| `expo-updates` | OTA update delivery |
| `expo-constants` | Access to `app.config.ts` extras and device info |
| `@shopify/flash-list` | High-performance list rendering (use instead of FlatList) |
| `react-native-reanimated` | UI-thread animations (use instead of Animated API) |
| `react-native-safe-area-context` | Safe area insets for notch/home indicator handling |

### Navigation Structure

All screens live in `app/`. Route groups `(group)` organize screens without affecting URLs. Every directory needs a `_layout.tsx`.

```
app/
├── _layout.tsx          # Root: SafeAreaProvider, auth gate
├── (auth)/
│   ├── _layout.tsx
│   └── login.tsx
└── (tabs)/
    ├── _layout.tsx      # Tab bar
    └── home.tsx
```

### Build and Distribution

- Use EAS Build for all distribution — never local builds for distribution
- Three profiles: `development` (dev client), `preview` (internal), `production` (store)
- OTA updates via `expo-updates` — check on foreground for JS-only changes
- Never eject — use config plugins for native code requirements
