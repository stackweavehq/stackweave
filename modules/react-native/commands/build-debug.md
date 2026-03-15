# Build Debug

Run the app in debug mode against the Metro bundler.

## iOS

```bash
# Start Metro (in a separate terminal)
npx react-native start

# Run on the default simulator
npx react-native run-ios

# Run on a specific simulator
npx react-native run-ios --simulator "iPhone 15 Pro"

# Clear Metro cache if you see stale module errors
npx react-native start --reset-cache
```

## Android

```bash
# Start Metro (in a separate terminal)
npx react-native start

# Run on a connected device or running emulator
npx react-native run-android

# Clear Metro cache
npx react-native start --reset-cache

# Full clean build (use when native changes are not picked up)
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Red screen "Unable to load script" | Make sure Metro is running (`npx react-native start`) |
| iOS build fails after adding a native dep | Run `pod install` in `ios/` and rebuild |
| Android build fails after adding a native dep | Run `./gradlew clean` in `android/` and rebuild |
| Styles look wrong after hot reload | Shake device → "Reload" (full JS reload) |
