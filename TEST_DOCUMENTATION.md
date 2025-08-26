# Authentication System Test Documentation

## Overview

This document describes the comprehensive testing setup for the authentication system in the Next.js 15 application. The test suite includes unit tests, component tests, integration tests, and API tests with high coverage targets (80%+).

## Test Setup

### Technologies Used

- **Jest**: Test runner and assertion library
- **React Testing Library**: Component testing utilities
- **MSW (Mock Service Worker)**: API mocking
- **Testing Library User Event**: User interaction simulation
- **Jest DOM**: Custom DOM matchers

### Installation

```bash
yarn add -D jest @jest/globals @testing-library/react @testing-library/jest-dom @testing-library/user-event @testing-library/dom @types/jest jest-environment-jsdom msw whatwg-fetch jest-watch-typeahead
```

### Configuration Files

#### jest.config.js
- Configures Jest with Next.js support
- Sets up module aliases and path mappings
- Defines coverage thresholds (80% for all metrics)
- Configures test environment as jsdom

#### jest.setup.js
- Loads testing library extensions
- Configures MSW server
- Adds necessary polyfills for Node.js environment
- Mocks Next.js navigation
- Sets up localStorage and sessionStorage mocks

## Test Structure

### Directory Organization

```
src/
├── components/
│   ├── auth/
│   │   ├── __tests__/
│   │   │   ├── LoginForm.test.tsx
│   │   │   └── RegisterForm.test.tsx
│   └── ui/
│       └── __tests__/
│           ├── Button.test.tsx
│           └── FormInput.test.tsx
├── hooks/
│   └── queries/
│       └── __tests__/
│           └── useAuthQueries.test.tsx
├── lib/
│   └── api/
│       └── __tests__/
│           └── client.test.ts
└── test/
    ├── fixtures/
    │   └── auth.ts
    ├── mocks/
    │   ├── handlers.ts
    │   └── server.ts
    └── utils/
        ├── test-utils.tsx
        └── test-helpers.ts
```

## Test Categories

### 1. Component Tests

#### LoginForm Component (`LoginForm.test.tsx`)
- **Rendering Tests**: Validates all form elements render correctly
- **Validation Tests**: Tests email format, password requirements, empty field validation
- **Submission Tests**: Tests successful login, error handling, loading states
- **Remember Me Feature**: Tests localStorage integration
- **Error Handling**: Tests error dismissal and recovery
- **Password Visibility**: Tests toggle functionality
- **Keyboard Navigation**: Tests Tab navigation and Enter key submission
- **Accessibility**: Tests ARIA attributes and screen reader support

#### RegisterForm Component (`RegisterForm.test.tsx`)
- **Rendering Tests**: Validates registration form elements
- **Validation Tests**: Tests all field validations including password matching
- **Password Strength**: Tests password strength indicator
- **Terms Acceptance**: Tests terms and conditions checkbox
- **Submission Tests**: Tests registration flow
- **Error Handling**: Tests duplicate email scenarios

#### UI Components
- **Button Component**: Tests variants, sizes, loading states, disabled states
- **FormInput Component**: Tests input types, validation, error states, accessibility

### 2. Hook Tests

#### useAuthQueries (`useAuthQueries.test.tsx`)
- **useLogin**: Tests successful login, error handling, token storage
- **useRegister**: Tests registration flow, email verification redirect
- **useCurrentUser**: Tests user fetching, token validation
- **useLogout**: Tests logout flow, token clearing
- **useRefreshToken**: Tests token refresh mechanism
- **useForgotPassword**: Tests password reset email flow
- **useResetPassword**: Tests password reset with token
- **useVerifyEmail**: Tests email verification
- **useUpdateProfile**: Tests optimistic updates and rollback

### 3. API Client Tests (`client.test.ts`)

#### Token Manager
- **setTokens**: Tests token storage in localStorage
- **getAccessToken/getRefreshToken**: Tests token retrieval
- **clearTokens**: Tests token removal
- **isTokenExpired**: Tests expiry validation

#### API Interceptors
- **Request Interceptor**: Tests Authorization header injection
- **Response Interceptor**: Tests error handling, token refresh on 401

#### API Methods
- Tests GET, POST, PUT, PATCH, DELETE requests
- Tests query parameter handling
- Tests error scenarios (network errors, timeouts)

### 4. Integration Tests

#### Authentication Flow
- Login → Dashboard navigation
- Registration → Email verification → Dashboard
- Password reset flow
- Token refresh during API calls

## Mock Data and Fixtures

### Auth Fixtures (`test/fixtures/auth.ts`)
- `mockUser`: Standard user object
- `mockUnverifiedUser`: User pending email verification
- `mockTokens`: Access and refresh tokens
- `mockAuthResponse`: Complete authentication response
- Helper functions for creating test data

### MSW Handlers (`test/mocks/handlers.ts`)
- Mock endpoints for all authentication APIs
- Simulates various success and error scenarios
- Handles token refresh logic
- Provides error simulation handlers

## Test Utilities

### Custom Render (`test/utils/test-utils.tsx`)
- `renderWithProviders`: Wraps components with QueryClient provider
- Includes user event setup
- Re-exports Testing Library utilities

### Test Helpers (`test/utils/test-helpers.ts`)
- `waitForLoadingToFinish`: Waits for loading states
- `mockAuthentication`: Sets up authenticated state
- `fillForm`: Helper for filling form inputs
- `expectValidationError`: Assertion helper for validation errors
- `expectAccessibleForm`: Accessibility assertions
- `expectButtonState`: Button state assertions

## Running Tests

### Available Scripts

```bash
# Run tests in watch mode (development)
yarn test

# Run all tests once (CI/CD)
yarn test:ci

# Generate coverage report
yarn test:coverage

# Debug tests
yarn test:debug
```

### Coverage Requirements

The project enforces 80% coverage thresholds for:
- Statements
- Branches
- Functions
- Lines

### Test Patterns

#### Example: Testing a Form Component

```typescript
describe('LoginForm', () => {
  const mockOnSubmit = jest.fn()
  
  beforeEach(() => {
    mockOnSubmit.mockClear()
  })

  it('should submit form with valid data', async () => {
    const { user } = render(<LoginForm onSubmit={mockOnSubmit} />)
    
    await fillForm(user, {
      'email address': 'test@example.com',
      'password': 'password123',
    })
    
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })
})
```

#### Example: Testing a Hook

```typescript
describe('useLogin', () => {
  it('should successfully login user', async () => {
    const { result } = renderHook(() => useLogin(), {
      wrapper: AllTheProviders,
    })

    await result.current.mutateAsync({
      email: 'test@example.com',
      password: 'Password123!',
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
      expect(tokenManager.setTokens).toHaveBeenCalled()
    })
  })
})
```

## Best Practices

### 1. Test User Behavior
- Test what users see and do, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Avoid testing internal state

### 2. Accessibility Testing
- Ensure all interactive elements have proper ARIA attributes
- Test keyboard navigation
- Verify screen reader compatibility

### 3. Error Handling
- Test both happy paths and error scenarios
- Verify error messages are user-friendly
- Test error recovery flows

### 4. Mock Management
- Use MSW for API mocking (network level)
- Keep mocks close to reality
- Test loading and error states

### 5. Test Organization
- Group related tests using describe blocks
- Use descriptive test names
- Keep tests focused and independent

### 6. Performance
- Use beforeEach/afterEach for cleanup
- Avoid unnecessary re-renders in tests
- Mock heavy operations

## Troubleshooting

### Common Issues

1. **TextEncoder/TextDecoder not defined**
   - Solution: Added polyfills in jest.setup.js

2. **MSW not intercepting requests**
   - Ensure server.listen() is called in beforeAll
   - Check API base URL matches

3. **React warnings in tests**
   - Use proper cleanup with afterEach
   - Ensure all async operations complete

4. **Flaky tests**
   - Use waitFor for async assertions
   - Increase timeout for slow operations
   - Check for race conditions

## Future Enhancements

1. **E2E Tests**: Add Cypress or Playwright for end-to-end testing
2. **Visual Regression**: Implement visual regression testing
3. **Performance Testing**: Add performance benchmarks
4. **Mutation Testing**: Use Stryker for mutation testing
5. **Contract Testing**: Add API contract tests

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [MSW Documentation](https://mswjs.io/docs/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)