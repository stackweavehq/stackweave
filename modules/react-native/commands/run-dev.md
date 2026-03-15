# Run Dev

Start the React Native development environment with Metro bundler and run on a simulator or device.

## Quick Start

```bash
# Start Metro bundler and run on iOS simulator
npx react-native run-ios

# Start Metro bundler and run on Android emulator
npx react-native run-android
```

## iOS

```bash
# Run on default simulator
npx react-native run-ios

# Run on a specific simulator
npx react-native run-ios --simulator "iPhone 15 Pro"

# Run on a specific device (connected via USB)
npx react-native run-ios --device "My iPhone"

# Run with a specific scheme (e.g., staging)
npx react-native run-ios --scheme "MyAppStaging"
```

## Android

```bash
# Run on connected device or running emulator
npx react-native run-android

# Run a specific build variant
npx react-native run-android --variant=stagingDebug

# List available Android devices
adb devices
```

## Metro Bundler

```bash
# Start Metro separately (useful for debugging Metro issues)
npx react-native start

# Start with cache cleared
npx react-native start --reset-cache

# Start on a custom port
npx react-native start --port 8082
```

## Platform Selection

When the user asks to "run the app" without specifying a platform:
1. Ask which platform (iOS or Android)
2. Default to iOS on macOS, Android on Linux/Windows
3. Check that the appropriate simulator/emulator is running

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Unable to load script" | Make sure Metro is running (`npx react-native start`) |
| iOS build fails after adding native dep | Run `cd ios && pod install && cd ..` |
| Android build fails after adding native dep | Run `cd android && ./gradlew clean && cd ..` |
| Styles wrong after hot reload | Shake device → "Reload" for full JS reload |
| Port 8081 already in use | Kill existing Metro or use `--port 8082` |
| "No bundle URL present" (iOS) | Clean build: `cd ios && xcodebuild clean && cd ..` then rebuild |
