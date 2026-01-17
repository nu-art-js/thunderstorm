# @nu-art/testalot

Testing utilities and test framework helpers for TypeScript projects. This package provides a structured approach to writing tests with type-safe test cases, flexible result validation, and support for both success and error scenarios.

## Installation and Usage

Add the package as a dependency in your `__package.json`:

```json
{
  "devDependencies": {
    "@nu-art/testalot": "?"
  }
}
```

Import and use the testing utilities in your test files:

```typescript
import {runSingleTestCase, TestModel} from '@nu-art/testalot';

type Input = { value: number };
type Result = { doubled: number };
type TestCase_Double = TestModel<Input, Result>;

const test = async (input: Input): Promise<Result> => {
  return { doubled: input.value * 2 };
};

const runTestCase = (testCase: TestCase_Double) => () => runSingleTestCase(test, testCase);

describe('Double function', () => {
  it('doubles a number', runTestCase({
    input: { value: 5 },
    result: { doubled: 10 }
  }));
});
```

## Key Features

### Core Functions

- **`runSingleTestCase`** - Runs a single test case with input and validates the result or error
- **`runScenario`** - Creates a test scenario runner for tests without input parameters
- **`defaultTestProcessor`** - Default test processor that handles promise validation with chai

### Types

- **`TestModel<Input, ExpectedResult>`** - Type-safe test case model with input and expected result or error
- **`ResolvableContent<T>`** - Content that can be either a value or a function that returns a value
- **`TestCase_Error`** - Error expectation type supporting string, regex, or function validation

### Flexible Validation

- **Value-based validation**: Deep equality comparison using chai
- **Function-based validation**: Custom async validation functions
- **Error validation**: String matching, regex patterns, or custom error validators

## API Overview

### runSingleTestCase

Runs a single test case with input and validates the result:

```typescript
runSingleTestCase<Input, Result, ExpectedResult>(
  test: (input: Input) => Promise<Result>,
  testCase: TestModel<Input, ExpectedResult>,
  processor?: TestProcessor
): Promise<void>
```

### runScenario

Creates a test scenario runner for tests without input parameters:

```typescript
runScenario<Result, ExpectedResult>(
  test: () => Promise<Result>,
  testCase?: TestModel<void, ExpectedResult>,
  processor?: TestProcessor
): () => Promise<void>
```

### TestModel

Type-safe test case structure:

```typescript
type TestModel<Input, ExpectedResult> = {
  description?: ResolvableContent<string, [TestModel<Input, ExpectedResult>]>;
  input: Input;
} & (
  { result: ExpectedResult | ((result: ExpectedResult) => Promise<any>) } |
  { error: TestCase_Error }
);
```

## Examples

### Basic Test with Value Validation

```typescript
import {runSingleTestCase, TestModel} from '@nu-art/testalot';

type Input = { a: number; b: number };
type Result = number;
type TestCase_Add = TestModel<Input, Result>;

const add = async (input: Input): Promise<Result> => {
  return input.a + input.b;
};

const runTestCase = (testCase: TestCase_Add) => () => runSingleTestCase(add, testCase);

describe('Addition', () => {
  it('adds two numbers', runTestCase({
    input: { a: 2, b: 3 },
    result: 5
  }));
});
```

### Test with Function-Based Validation

```typescript
it('validates with custom function', runTestCase({
  input: { a: 10, b: 20 },
  result: async (result: number) => {
    if (result !== 30) 
      throw new Error(`Expected 30, got ${result}`);
    // Additional custom validation logic
  }
}));
```

### Test with Error Validation

```typescript
it('expects an error', runTestCase({
  input: { value: -1 },
  error: { expected: 'Value must be positive' }
}));

it('expects error with regex', runTestCase({
  input: { value: -1 },
  error: { expected: /must be positive/i }
}));

it('validates error with function', runTestCase({
  input: { value: -1 },
  error: async (error: Error) => {
    if (!error.message.includes('positive')) {
      throw new Error('Error validation failed');
    }
  }
}));
```

### Resolvable Content

Test cases support resolvable content (values or functions):

```typescript
it('uses resolvable input', runTestCase({
  input: (() => {
    const computed = computeValue();
    return { value: computed };
  })(),
  result: expectedValue
}));
```

### Scenario Tests (No Input)

```typescript
import {runScenario} from '@nu-art/testalot';

const testFunction = async (): Promise<string> => {
  return 'result';
};

describe('Scenarios', () => {
  it('runs without test case (accepts any result)', runScenario(testFunction));

  it('runs with validation', runScenario(
    testFunction,
    { input: undefined, result: 'result' }
  ));
});
```

### Custom Test Processor

```typescript
import {defaultTestProcessor} from '@nu-art/testalot';

const customProcessor = async (promisedResult, expectedResult, error) => {
  // Custom validation logic
  const result = await promisedResult;
  // ... custom checks
};

it('uses custom processor', runTestCase(
  test,
  { input: {...}, result: ... },
  customProcessor
));
```

## Best Practices

1. **Type Safety**: Always define `Input` and `Result` types for your test cases
2. **Test Case Types**: Create a `TestCase_FeatureName` type alias for each test suite
3. **Helper Functions**: Create a `runTestCase` wrapper function for each test suite
4. **Descriptive Names**: Use clear test case descriptions
5. **Error Handling**: Use appropriate error validation (string, regex, or function) based on needs

## Integration with Mocha

Testalot is designed to work seamlessly with Mocha. The `runSingleTestCase` and `runScenario` functions return functions that can be used directly as Mocha test callbacks:

```typescript
describe('My Feature', () => {
  it('test description', runTestCase({ input: {...}, result: ... }));
});
```
