# Custom Hooks

This directory contains reusable custom React hooks that encapsulate common logic and state management patterns.

## Available Hooks

- `useAuth.ts` - Authentication state management
- `useAnalysis.ts` - Data fetching and state management for analyses

## Usage

Import hooks at the top of your component:

```typescript
import { useAuth } from '../hooks/useAuth';
```

## Best Practices

1. **Naming Convention**: Start hook names with `use` (e.g., `useFeature`)
2. **Single Responsibility**: Each hook should focus on a single piece of functionality
3. **Dependencies**: Properly declare all dependencies in the dependency array
4. **Documentation**: Include JSDoc comments explaining the hook's purpose, parameters, and return value
5. **Testing**: Each hook should have corresponding test cases

## Creating New Hooks

1. Create a new file with a descriptive name starting with `use`
2. Export the hook as a named export
3. Add TypeScript types for parameters and return values
4. Document the hook's purpose and usage
5. Add error handling where appropriate

## Example

```typescript
/**
 * Custom hook for handling form state and validation
 * @param initialValues - Initial form values
 * @param validate - Validation function
 * @returns Form state and handlers
 */
function useForm(initialValues, validate) {
  // Hook implementation
}
```
