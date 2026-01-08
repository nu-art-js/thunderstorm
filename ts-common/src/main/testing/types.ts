/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ResolvableContent} from '../utils/types.js';

/**
 * Test case input/output type.
 * 
 * @template Input - Input type for the test
 * @template Result - Expected result type
 */
export type Types<Input, Result> = {
	expected?: Result;
	input: Input;
}

/**
 * Error expectation for test cases.
 * 
 * Can be:
 * - Object with expected error message/pattern and optional constructor
 * - Function that validates the error
 */
export type TestCase_Error = { expected: string | RegExp, message?: string, constructor?: Error | Function } | ((error: Error) => Promise<any>);

/**
 * Test case model with input and expected result or error.
 * 
 * Supports:
 * - Resolvable content (value or function)
 * - Optional description (can reference the test case itself)
 * - Expected result (value or validation function)
 * - Expected error (object or validation function)
 * 
 * @template Input - Input type
 * @template ExpectedResult - Expected result type
 */
export type TestModel<Input, ExpectedResult> = ResolvableContent<
	{
		description?: ResolvableContent<string, [TestModel<Input, ExpectedResult>]>
		input: Input,
	} &
	({ result: ExpectedResult | ((result: ExpectedResult) => Promise<any>) } |
		{
			error: TestCase_Error
		})
>

/**
 * Function that processes a test case.
 * 
 * @template Input - Input type
 * @template ExpectedResult - Expected result type
 */
export type TestProcessor<Input, ExpectedResult> = (input: TestModel<Input, ExpectedResult>) => void | Promise<void>;

/**
 * Test suite configuration.
 * 
 * Defines a collection of test cases with setup/teardown hooks.
 * 
 * @template Input - Input type for test cases
 * @template ExpectedResult - Expected result type
 */
export type TestSuite<Input, ExpectedResult> = {
	/** Optional setup function (runs before all tests) */
	before?: () => (void | Promise<void>);
	/** Function that processes each test case */
	processor: TestProcessor<Input, ExpectedResult>;
	/** Optional teardown function (runs after all tests) */
	after?: () => (void | Promise<void>);
	/** Array of test cases */
	testcases: TestModel<Input, ExpectedResult>[];
	/** Suite label/name */
	label: string,
	/** Optional timeout in milliseconds (default: 5000) */
	timeout?: number,
}

/**
 * Interface for modules that support test reset functionality.
 * 
 * Modules implementing this interface can be reset to a clean state
 * between tests via the `dispatcher_resetTests` dispatcher.
 */
export interface TestResetListener {
	/**
	 * Resets the module to a clean state for testing.
	 * 
	 * Called by the test framework to reset module state between tests.
	 */
	__resetForTests: () => Promise<any>;
}

