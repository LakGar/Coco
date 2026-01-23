# Testing Guide

This project uses Jest and React Testing Library for testing.

## Setup

Install dependencies:
```bash
npm install
```

## Running Tests

Run all tests:
```bash
npm test
```

Run tests in watch mode (for development):
```bash
npm run test:watch
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Test Structure

Tests are organized in the `__tests__` directory mirroring the source structure:

- `__tests__/lib/` - Tests for utility functions and validation schemas
- `__tests__/store/` - Tests for Zustand stores
- `__tests__/api/` - Tests for API route validation and helpers

## Test Coverage

Current coverage targets:
- Branches: 60%
- Functions: 60%
- Lines: 60%
- Statements: 60%

## Writing Tests

### Example: Testing a Validation Schema

```typescript
import { createTaskSchema } from '@/lib/validations'

test('validates valid task', () => {
  const validTask = {
    name: 'Test Task',
    priority: 'HIGH',
    status: 'TODO',
  }
  expect(() => createTaskSchema.parse(validTask)).not.toThrow()
})
```

### Example: Testing a Store

```typescript
import { renderHook, act } from '@testing-library/react'
import { useTeamStore } from '@/store/use-team-store'

test('sets active team', () => {
  const { result } = renderHook(() => useTeamStore())
  const team = { id: 'team-1', name: 'Test Team' }

  act(() => {
    result.current.setActiveTeam(team)
  })

  expect(result.current.activeTeam).toEqual(team)
})
```

## Mocking

Common mocks are set up in `jest.setup.js`:
- Next.js router (`next/navigation`)
- Clerk authentication (`@clerk/nextjs`)
- Environment variables

## Best Practices

1. **Test critical paths first**: Focus on validation, authentication, and core business logic
2. **Keep tests isolated**: Each test should be independent
3. **Use descriptive test names**: Test names should clearly describe what they're testing
4. **Mock external dependencies**: Mock API calls, database queries, and external services
5. **Test error cases**: Don't just test happy paths, test error handling too
