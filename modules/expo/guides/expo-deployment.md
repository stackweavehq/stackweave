# Expo Deployment Guide

This guide covers the full EAS workflow: building, distributing, and updating an Expo app.

---

## EAS Build Profiles

EAS Build uses profiles defined in `eas.json`. Three profiles cover the standard lifecycle:

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "env": {
        "APP_ENV": "development"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      },
      "env": {
        "APP_ENV": "preview"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "APP_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "team@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCDE12345"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### Profile Purposes

| Profile | Who it's for | Distribution |
|---------|-------------|--------------|
| `development` | Developers — connects to local Metro bundler | Internal (registered devices) |
| `preview` | Testers / QA — standalone build, no Metro required | Internal (TestFlight, direct APK) |
| `production` | App store submission | App Store / Play Store |

---

## EAS Submit

After a production build completes:

```bash
# Submit the latest build for each platform
eas submit --platform ios
eas submit --platform android

# Submit a specific build (by build ID from eas build:list)
eas submit --platform ios --id <build-id>

# Combined: build and submit in one step
eas build --platform all --profile production --auto-submit
```

### App Store (iOS)

- `eas submit` uploads to App Store Connect and submits for review
- Requires an app record created in App Store Connect beforehand
- Configure `appleId`, `ascAppId`, and `appleTeamId` in `eas.json`

### Play Store (Android)

- Requires a Google service account JSON key with Play Store API access
- Store the key path in `eas.json` (the file itself should be gitignored)
- First submission must be manual (drag-and-drop AAB in the Play Console) — subsequent ones can be automated

---

## expo-updates OTA Update Strategy

OTA updates deliver JS bundle changes without going through the app stores.

### When to use OTA vs a store build

| Change type | OTA valid? |
|------------|-----------|
| JS / TypeScript logic changes | Yes |
| New screens, UI changes | Yes |
| New npm packages (JS only) | Yes |
| New native dependencies | No — requires a new build |
| config plugin changes | No — requires a new build |
| app.config.ts changes | No — requires a new build |

### Update Check on Foreground

```typescript
import * as Updates from 'expo-updates';
import { useEffect } from 'react';

export function useOtaUpdate(): void {
  useEffect(() => {
    async function check(): Promise<void> {
      if (__DEV__) return;
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (err) {
        console.warn('OTA check failed', err);
      }
    }
    check();
  }, []);
}
```

Call this hook in the root `_layout.tsx`.

### Update Channels

In `eas.json`, configure update channels per profile:

```json
{
  "build": {
    "preview": { "channel": "preview" },
    "production": { "channel": "production" }
  }
}
```

Publish an update to a specific channel:
```bash
eas update --branch production --message "Fix checkout crash"
```

---

## Environment Variables in EAS

### Secrets (sensitive values)

Store secrets in EAS — they are encrypted and injected at build time:

```bash
eas secret:create --scope project --name SUPABASE_SERVICE_KEY --value <value>
eas secret:list
```

### Non-secret config

Store in `eas.json` under `env` per profile:

```json
{
  "build": {
    "production": {
      "env": {
        "API_URL": "https://api.example.com",
        "APP_ENV": "production"
      }
    }
  }
}
```

Access in `app.config.ts`:

```typescript
extra: {
  apiUrl: process.env.API_URL,
}
```

---

## Versioning: buildNumber / versionCode Management

With `"autoIncrement": true` in the production profile, EAS automatically increments `buildNumber` (iOS) and `versionCode` (Android) on each build.

Human-readable version (`version` in `app.config.ts`) should be incremented manually following semantic versioning:

```typescript
export default {
  version: '2.4.0',
  ios: { buildNumber: '1' },       // managed by EAS autoIncrement
  android: { versionCode: 1 },     // managed by EAS autoIncrement
};
```

---

## CI/CD Integration with GitHub Actions

```yaml
# .github/workflows/eas-build.yml
name: EAS Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: $\{{ secrets.EXPO_TOKEN }}

      - run: eas build --platform all --profile production --non-interactive --no-wait
```

`EXPO_TOKEN` is a personal access token from [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens).
