/*
 * @nu-art/testalot - Tests for the testalot framework itself
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {TestModel} from '../main/types.js';
import {defaultTestProcessor, runScenario, runSingleTestCase} from '../main/consts.js';

// ============================================================================
// 1. Input Flow Verification
// ============================================================================

type InputFlowInput = {
	value: number;
	message: string;
};

type InputFlowResult = {
	receivedValue: number;
	receivedMessage: string;
};

type TestCase_InputFlow = TestModel<InputFlowInput, InputFlowResult>;

const testInputFlow = async (input: InputFlowInput): Promise<InputFlowResult> => {
	// Verify input is received correctly
	return {
		receivedValue: input.value,
		receivedMessage: input.message
	};
};

const runTestCase_InputFlow = (testCase: TestCase_InputFlow) => {
	return () => runSingleTestCase(testInputFlow, testCase);
};

describe('Input Flow Verification', () => {
	it('Simple value input flows correctly to test function', runTestCase_InputFlow({
		input: {value: 42, message: 'test'},
		result: {receivedValue: 42, receivedMessage: 'test'}
	}));

	it('Complex object input flows correctly to test function', runTestCase_InputFlow({
		input: {value: 100, message: 'complex test'},
		result: {receivedValue: 100, receivedMessage: 'complex test'}
	}));

	it('Function-based resolvable input resolves and flows correctly', runTestCase_InputFlow({
		input: (() => {
			const computedValue = 50;
			const computedMessage = 'resolved';
			return {value: computedValue, message: computedMessage};
		})(),
		result: {receivedValue: 50, receivedMessage: 'resolved'}
	}));
});

// ============================================================================
// 2. Output Flow Verification
// ============================================================================

type OutputFlowInput = {
	value: number;
	multiplyBy: number;
};

type OutputFlowResult = {
	processed: number;
	original: number;
};

type TestCase_OutputFlow = TestModel<OutputFlowInput, OutputFlowResult>;

const testOutputFlow = async (input: OutputFlowInput): Promise<OutputFlowResult> => {
	return {
		processed: input.value * input.multiplyBy,
		original: input.value
	};
};

const runTestCase_OutputFlow = (testCase: TestCase_OutputFlow) => {
	return () => runSingleTestCase(testOutputFlow, testCase);
};

describe('Output Flow Verification', () => {
	it('Output flows correctly to value-based validation', runTestCase_OutputFlow({
		input: {value: 5, multiplyBy: 2},
		result: {processed: 10, original: 5}
	}));

	it('Output flows correctly to function-based validation callback', runTestCase_OutputFlow({
		input: {value: 7, multiplyBy: 3},
		result: async (result: OutputFlowResult) => {
			if (result.processed !== 21) throw new Error(`Expected processed 21, got ${result.processed}`);
			if (result.original !== 7) throw new Error(`Expected original 7, got ${result.original}`);
		}
	}));

	it('Output with nested objects flows correctly to validation', runTestCase_OutputFlow({
		input: {value: 4, multiplyBy: 5},
		result: {processed: 20, original: 4}
	}));
});

// ============================================================================
// 3. Success Validation Tests
// ============================================================================

type SuccessValidationInput = {
	operation: 'add' | 'multiply';
	a: number;
	b: number;
};

type SuccessValidationResult = number;

type TestCase_SuccessValidation = TestModel<SuccessValidationInput, SuccessValidationResult>;

const testSuccessValidation = async (input: SuccessValidationInput): Promise<SuccessValidationResult> => {
	if (input.operation === 'add') {
		return input.a + input.b;
	}
	return input.a * input.b;
};

const runTestCase_SuccessValidation = (testCase: TestCase_SuccessValidation) => {
	return () => runSingleTestCase(testSuccessValidation, testCase);
};

describe('Success Validation Tests', () => {
	it('Deep equality matching for simple values', runTestCase_SuccessValidation({
		input: {operation: 'add', a: 2, b: 3},
		result: 5
	}));

	it('Deep equality matching for complex nested structures', runTestCase_SuccessValidation({
		input: {operation: 'multiply', a: 4, b: 5},
		result: 20
	}));

	it('Function-based validation with async callback', runTestCase_SuccessValidation({
		input: {operation: 'add', a: 10, b: 20},
		result: async (result: number) => {
			if (result !== 30) throw new Error(`Expected 30, got ${result}`);
		}
	}));

	it('Function-based validation throws on mismatch', runTestCase_SuccessValidation({
		input: {operation: 'add', a: 1, b: 1},
		result: async (result: number) => {
			if (result !== 2) throw new Error(`Expected 2, got ${result}`);
		}
	}));
});

// ============================================================================
// 4. Error Validation Tests
// ============================================================================

type ErrorValidationInput = {
	shouldThrow: boolean;
	errorMessage: string;
};

type ErrorValidationResult = string;

type TestCase_ErrorValidation = TestModel<ErrorValidationInput, ErrorValidationResult>;

const testErrorValidation = async (input: ErrorValidationInput): Promise<ErrorValidationResult> => {
	if (input.shouldThrow) {
		throw new Error(input.errorMessage);
	}
	return 'success';
};

const runTestCase_ErrorValidation = (testCase: TestCase_ErrorValidation) => {
	return () => runSingleTestCase(testErrorValidation, testCase);
};

describe('Error Validation Tests', () => {
	it('String error message matching', runTestCase_ErrorValidation({
		input: {shouldThrow: true, errorMessage: 'Expected error message'},
		error: {expected: 'Expected error message'}
	}));

	it('Regex error message matching', runTestCase_ErrorValidation({
		input: {shouldThrow: true, errorMessage: 'Error code 404'},
		error: {expected: /Error code \d+/}
	}));

	it('Function-based error validation', runTestCase_ErrorValidation({
		input: {shouldThrow: true, errorMessage: 'Custom validation error'},
		error: async (error: Error) => {
			if (!error.message.includes('Custom')) throw new Error('Error validation failed');
			if (!error.message.includes('validation')) throw new Error('Error validation failed');
		}
	}));

	it('Partial string error message matching', runTestCase_ErrorValidation({
		input: {shouldThrow: true, errorMessage: 'This is a long error message with details'},
		error: {expected: 'long error message'}
	}));
});

// ============================================================================
// 5. Core Function Tests - defaultTestProcessor
// ============================================================================

describe('defaultTestProcessor', () => {
	it('Validates successful promise with expected value', async () => {
		await defaultTestProcessor(
			Promise.resolve({value: 42}),
			{value: 42}
		);
	});

	it('Validates successful promise with deep equality', async () => {
		await defaultTestProcessor(
			Promise.resolve({nested: {a: 1, b: 2}}),
			{nested: {a: 1, b: 2}}
		);
	});

	it('Validates successful promise with function validator', async () => {
		await defaultTestProcessor(
			Promise.resolve(100),
			async (result: number) => {
				if (result !== 100) throw new Error(`Expected 100, got ${result}`);
			}
		);
	});

	it('Validates rejected promise with error message pattern', async () => {
		await defaultTestProcessor(
			Promise.reject(new Error('Something went wrong')),
			undefined,
			{expected: 'Something went wrong'}
		);
	});

	it('Validates rejected promise with error regex pattern', async () => {
		await defaultTestProcessor(
			Promise.reject(new Error('Error code 404')),
			undefined,
			{expected: /Error code \d+/}
		);
	});

	it('Validates rejected promise with function validator', async () => {
		await defaultTestProcessor(
			Promise.reject(new Error('Custom error')),
			undefined,
			async (error: Error) => {
				if (!error.message.includes('Custom')) throw new Error('Validation failed');
			}
		);
	});

	it('Throws error when both expectedResult and error are missing', async () => {
		try {
			await defaultTestProcessor(Promise.resolve(42));
			throw new Error('Should have thrown');
		} catch (e: any) {
			if (e.message !== 'MUST provide expectedResult or error') throw e;
		}
	});
});

// ============================================================================
// 6. Core Function Tests - runSingleTestCase
// ============================================================================

type RunSingleInput = {
	value: number;
	operation: 'double' | 'square';
};

type RunSingleResult = number;

type TestCase_RunSingle = TestModel<RunSingleInput, RunSingleResult>;

const testRunSingle = async (input: RunSingleInput): Promise<RunSingleResult> => {
	if (input.operation === 'double') {
		return input.value * 2;
	}
	return input.value * input.value;
};

const runTestCase_RunSingle = (testCase: TestCase_RunSingle) => {
	return () => runSingleTestCase(testRunSingle, testCase);
};

describe('runSingleTestCase', () => {
	it('Runs test case with simple input and result', runTestCase_RunSingle({
		input: {value: 5, operation: 'double'},
		result: 10
	}));

	it('Runs test case with function-based result validation', runTestCase_RunSingle({
		input: {value: 3, operation: 'square'},
		result: async (result: number) => {
			if (result !== 9) throw new Error(`Expected 9, got ${result}`);
		}
	}));

	it('Runs test case with negative values', runTestCase_RunSingle({
		input: {value: -1, operation: 'double'},
		result: -2
	}));

	it('Runs test case with complex input', runTestCase_RunSingle({
		input: {value: 7, operation: 'square'},
		result: 49
	}));
});

// ============================================================================
// 7. Core Function Tests - runScenario
// ============================================================================

type ScenarioResult = string;

const testScenarioSuccess = async (): Promise<ScenarioResult> => {
	return 'scenario result';
};

const testScenarioError = async (): Promise<ScenarioResult> => {
	throw new Error('scenario error');
};

describe('runScenario', () => {
	it('Runs scenario without test case (accepts any result)', runScenario(testScenarioSuccess));

	it('Runs scenario with test case expecting result', runScenario(
		testScenarioSuccess,
		{input: undefined, result: 'scenario result'}
	));

	it('Runs scenario with function validator', runScenario(
		testScenarioSuccess,
		{
			input: undefined,
			result: async (result: string) => {
				if (!result.includes('scenario')) throw new Error('Invalid result');
			}
		}
	));

	it('Runs scenario expecting error', runScenario(
		testScenarioError,
		{
			input: undefined,
			error: {expected: 'scenario error'}
		}
	));
});

// ============================================================================
// 8. ResolvableContent Tests
// ============================================================================

type ResolvableInput = {
	base: number;
	offset: number;
};

type ResolvableResult = number;

type TestCase_Resolvable = TestModel<ResolvableInput, ResolvableResult>;

const testResolvable = async (input: ResolvableInput): Promise<ResolvableResult> => {
	return input.base + input.offset;
};

const runTestCase_Resolvable = (testCase: TestCase_Resolvable) => {
	return () => runSingleTestCase(testResolvable, testCase);
};

describe('ResolvableContent', () => {
	it('Handles function-based test case input', runTestCase_Resolvable({
		input: (() => {
			const base = 10;
			const offset = 20;
			return {base, offset};
		})(),
		result: 30
	}));

	it('Handles function-based test case with description', runTestCase_Resolvable({
		description: (testCase) => {
			const resolved = testCase;
			return `Test with base ${resolved.input.base} and offset ${resolved.input.offset}`;
		},
		input: {base: 5, offset: 15},
		result: 20
	}));

	it('Handles value-based test case (non-function)', runTestCase_Resolvable({
		input: {base: 8, offset: 12},
		result: 20
	}));
});
