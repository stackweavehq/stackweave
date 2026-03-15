## React Native Stack

This project is built with **React Native** using the bare workflow (no Expo managed workflow).

### Toolchain

| Tool | Purpose |
|------|---------|
| Metro | JS bundler and hot reload server |
| EAS Build | Cloud build service for iOS and Android |
| React Navigation | In-app routing |
| Flipper | Native debugging (iOS + Android) |

### Build Targets

- **iOS**: minimum deployment target iOS 16
- **Android**: minimum SDK 26 (Android 8.0)

### Architecture Notes

- All components are functional; class components are prohibited.
- Styles use `StyleSheet.create` — no inline style objects.
- Platform divergences are isolated to `.ios.tsx` / `.android.tsx` files or `Platform.select`.
- Navigation is typed end-to-end via `RootStackParamList`.

### EAS Build

```bash
# Development build (installable on device, connects to local Metro)
eas build --profile development --platform ios

# Preview build (standalone, no Metro required)
eas build --profile preview --platform all
```
