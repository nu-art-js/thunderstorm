/*
 * @nu-art/testalot - Testing utilities and test framework helpers
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {TestCase_Error, TestModel, TestSuite} from './types.js';
import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

/**
 * Resolves content that can be either a value or a function.
 */
function resolveContent<T = any, P extends any[] = any[]>(content: T | ((...param: P) => T), ...param: P): T {
	return typeof content === 'function' ? (content as (...param: P) => T)(...param) : content as T;
}

/**
 * Void value constant.
 */
const Void = undefined;

/**
 * Async function that returns void.
 */
const voidFunction = Object.freeze(async () => {
});


/**
 * Runs a single test case within a test suite.
 *
 * Creates an Mocha `it()` test with the test case description and processor.
 *
 * @template Input - Input type
 * @template ExpectedResult - Expected result type
 * @param testSuit - Test suite configuration
 * @param testCase - Test case to run
 */
export function testSuite_RunTest<Input, ExpectedResult>(testSuit: TestSuite<Input, ExpectedResult>, testCase: TestModel<Input, ExpectedResult>) {
	it(resolveContent(resolveContent(testCase).description!, testCase), () => testSuit.processor(testCase)).timeout(testSuit.timeout || 5000);
}

/**
 * Sets up and runs a test suite with Mocha hooks.
 *
 * Configures `before()` and `after()` hooks if provided, and runs each test case.
 *
 * @template Input - Input type
 * @template ExpectedResult - Expected result type
 * @param testSuit - Test suite configuration
 * @param testcases - Optional test cases (uses testSuit.testcases if not provided)
 */
export const testSuiteTester = <Input, ExpectedResult>(testSuit: TestSuite<Input, ExpectedResult>, ...testcases: TestSuite<Input, ExpectedResult>['testcases']) => {
	if (testSuit.before)
		before(() => {
			testSuit.before?.();
			console.log(`[${testSuit.label}] -----  Before Finished  -----`);
		});

	(testcases.length > 0 ? testcases : testSuit.testcases).forEach(testCase => {
		testSuite_RunTest(testSuit, resolveContent(testCase));
	});


	//Run pre-process
	if (testSuit.after)
		after(() => {
			console.log(`[${testSuit.label}] -----  After Started  -----`);
			testSuit.after?.();
		});

};

/**
 * Default test processor for async test cases.
 *
 * Validates that either `expectedResult` or `error` is provided, then:
 * - If error is expected: Asserts the promise rejects with the expected error
 * - If result is expected: Awaits the promise and validates the result
 *   - If expectedResult is a function: Calls it with the actual result
 *   - Otherwise: Deep equals comparison
 *
 * @template Result - Actual result type
 * @template ExpectedResult - Expected result type
 */
export type DefaultTestProcessor<Result = any, ExpectedResult = Result> = (promisedResult: Promise<Result>, expectedResult?: ((() => Promise<any>) | ExpectedResult), error?: TestCase_Error) => Promise<any>;

/**
 * Default implementation of test processor.
 *
 * Handles both success and error cases, with flexible result validation.
 */
export const defaultTestProcessor: DefaultTestProcessor = async (promisedResult, expectedResult, error) => {
	if (expectedResult == null && error == null)
		throw new Error('MUST provide expectedResult or error');

	if (typeof error === 'object')
		return expect(promisedResult).to.be.rejectedWith(error.expected);

	let result: any;
	try {
		result = await promisedResult;
	} catch (e: any) {
		if (typeof error === 'function')
			return await error(e);

		throw e;
	}

	if (typeof expectedResult === 'function')
		return await (expectedResult as (result: any) => Promise<any>)(result);

	expect(result).to.deep.equal(expectedResult);
};


/**
 * Creates a test scenario runner function.
 *
 * Returns a function that can be used as a Mocha test. If no test case is provided,
 * creates a default test case that accepts any result.
 *
 * @template Result - Actual result type
 * @template ExpectedResult - Expected result type
 * @param test - Async function to test
 * @param _testCase - Optional test case (creates default if not provided)
 * @param processor - Test processor function (default: defaultTestProcessor)
 * @returns Function that can be used as a Mocha test
 */
export const runScenario = <Result, ExpectedResult = Result>(test: () => Promise<Result>, _testCase?: TestModel<void, ExpectedResult>, processor = defaultTestProcessor) => {
	let testCase;
	if (_testCase)
		testCase = resolveContent(_testCase);
	else
		testCase = {
			input: Void,
			result: async (r: ExpectedResult) => {
			}
		};

	return async () => runSingleTestCase(test, testCase, processor);
};

/**
 * Runs a single test case with input.
 *
 * Resolves the test case, extracts expected result or error, and runs the test.
 *
 * @template Input - Input type
 * @template Result - Actual result type
 * @template ExpectedResult - Expected result type
 * @param test - Async function that takes input and returns result
 * @param _testCase - Test case with input and expectations
 * @param processor - Test processor function (default: defaultTestProcessor)
 */
export const runSingleTestCase = async <Input, Result, ExpectedResult = Result>(test: (input: Input) => Promise<Result>, _testCase: TestModel<Input, ExpectedResult>, processor = defaultTestProcessor) => {
	const testCase = resolveContent(_testCase);
	const expectedResult = 'result' in testCase ? testCase.result : undefined;
	const error = 'error' in testCase ? testCase.error : undefined;
	return processor(test(testCase.input), expectedResult, error);
};


/**
 * Expects an async action to fail (throw an error).
 *
 * If the action succeeds, returns an expectation that will fail.
 * If it throws, returns an expectation that will pass.
 *
 * @param action - Async function that should throw
 * @returns Chai expectation
 */
export const expectFailAsync = async (action: () => Promise<void>) => {
	try {
		await action();
		return expect(voidFunction);
	} catch (e) {
		return expect(() => {
			throw e;
		});
	}
};

