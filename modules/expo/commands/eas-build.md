# EAS Build

Trigger an EAS Build for this project.

## Steps

1. Ask the user:
   - **Platform**: `ios`, `android`, or `all`
   - **Profile**: `development`, `preview`, or `production`

2. Confirm the build command:

```bash
# Single platform
eas build --platform <ios|android> --profile <development|preview|production>

# All platforms
eas build --platform all --profile <profile>
```

3. Show the complete commands for each combination:

### Development build (dev client — connects to local Metro)
```bash
eas build --platform ios --profile development
eas build --platform android --profile development
eas build --platform all --profile development
```

### Preview build (internal distribution, standalone)
```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
eas build --platform all --profile preview
```

### Production build (App Store / Play Store submission)
```bash
eas build --platform ios --profile production
eas build --platform android --profile production
eas build --platform all --profile production
```

## Useful Flags

| Flag | Effect |
|------|--------|
| `--non-interactive` | Run without prompts — for CI pipelines |
| `--local` | Build locally instead of on EAS servers |
| `--clear-cache` | Clear the build cache (use when native deps change) |
| `--no-wait` | Submit the build and exit without waiting for it to finish |
| `--message "..."` | Attach a build message visible in the EAS dashboard |
| `--auto-submit` | Automatically submit to App Store/Play Store when build completes |

## Example CI Command

```bash
eas build --platform all --profile production --non-interactive --no-wait
```

## After the Build

- **Development**: install on device via the EAS dashboard link or `eas build:run`
- **Preview**: share the install link with testers (iOS: OTA install link; Android: APK download)
- **Production**: submit to stores with `eas submit --platform <ios|android>` or use `--auto-submit`

## Check Build Status

```bash
eas build:list
eas build:view  # opens the latest build in the browser
```

## Notes

- Builds for `{{target_platforms}}` are supported by this project.
- EAS Build is {{use_eas}} in this project's configuration.
- Minimum targets: iOS {{min_ios}}, Android SDK {{min_sdk_android}}.
- If the build fails, check the build logs in the EAS dashboard for native compilation errors.
