## React Native Stack

This project is built with **React Native** using the bare workflow (no Expo managed workflow).

### Toolchain

| Tool | Purpose |
|------|---------|
| Metro | JS bundler and hot reload server |
| EAS Build | Cloud build service for iOS and Android |
| {{navigation_library}} | In-app routing and navigation |
| {{state_management}} | State management |
| Flipper | Native debugging (iOS + Android) |

### Build Targets

- **iOS**: minimum deployment target iOS {{min_ios}}
- **Android**: minimum SDK {{min_sdk_android}}

### Styling

Styling approach: **{{styling}}**

### Architecture Notes

- All components are functional; class components are prohibited.
- TypeScript is {{#if use_typescript}}required for all source files{{else}}optional{{/if}}.
- Styles use `StyleSheet.create` — no inline style objects.
- Platform divergences are isolated to `.ios.tsx` / `.android.tsx` files or `Platform.select`.
- Navigation is typed end-to-end via `RootStackParamList`.
- State is managed with {{state_management}}.

### EAS Build

```bash
# Development build (installable on device, connects to local Metro)
eas build --profile development --platform ios

# Preview build (standalone, no Metro required)
eas build --profile preview --platform all
```
