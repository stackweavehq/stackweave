# React Native Testing

## Component Testing

Use **React Native Testing Library** (`@testing-library/react-native`) for all component tests.
Test behavior, not implementation details.

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';

test('shows error when form is submitted empty', () => {
  render(<LoginForm />);
  fireEvent.press(screen.getByRole('button', { name: 'Submit' }));
  expect(screen.getByText('Email is required')).toBeTruthy();
});
```

### Query Priority

Prefer queries in this order:
1. `getByRole` — matches accessibility role and name
2. `getByText` — matches visible text
3. `getByPlaceholderText` — for text inputs
4. `getByTestId` — last resort only

### What to Test

- User-visible behavior (text appears, navigation happens, state changes)
- Conditional rendering based on props or state
- Form validation and submission
- Error states and loading states

### What NOT to Test

- Internal state values directly
- Implementation details (which hook was called, internal method names)
- Styles or layout (test visual regression separately)

## Mocking Native Modules

Create mocks in `__mocks__/` or in `jest.setup.js` for native modules that don't run in Node.

```ts
// jest.setup.js
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

### Mock Guidelines

- Mock at the module boundary, not inside components.
- Use the library's official mock if one exists.
- Keep mocks minimal — only mock what the test needs.
- Never mock `react` or `react-native` core components.

## Integration Testing

For testing navigation flows or multi-screen interactions, render the full navigator:

```tsx
import { NavigationContainer } from '@react-navigation/native';

function renderWithNavigation(component: React.ReactElement) {
  return render(
    <NavigationContainer>{component}</NavigationContainer>
  );
}
```

## E2E Testing

Use **Maestro** or **Detox** for end-to-end testing on real devices/simulators.

### Maestro (Recommended)

Maestro uses YAML flows and requires no test code changes:

```yaml
# flows/login.yaml
appId: com.myapp
---
- launchApp
- tapOn: "Email"
- inputText: "user@example.com"
- tapOn: "Password"
- inputText: "secret123"
- tapOn: "Sign In"
- assertVisible: "Welcome"
```

### Detox

For complex gesture testing or CI-integrated E2E:

```ts
describe('Login', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('user@example.com');
    await element(by.id('password-input')).typeText('secret123');
    await element(by.id('login-button')).tap();
    await expect(element(by.text('Welcome'))).toBeVisible();
  });
});
```

## Test Organization

```
__tests__/
  components/       # Unit tests for individual components
  screens/          # Integration tests for screens
  hooks/            # Tests for custom hooks
  utils/            # Tests for utility functions
e2e/
  flows/            # Maestro YAML flows or Detox specs
```
