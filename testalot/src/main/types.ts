/*
 * @nu-art/testalot - Testing utilities and test framework helpers
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */


/**
 * Content that can be either a value or a function that returns a value.
 */
export type ResolvableContent<T, K extends any[] = any[]> = T | ((...param: K) => T);

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
export type TestModel<Input, ExpectedResult> = {
	description?: ResolvableContent<string, [TestModel<Input, ExpectedResult>]>
	input: Input,
} &
	({ result: ExpectedResult | ((result: ExpectedResult) => Promise<any>) } |
		{
			error: TestCase_Error
		})

/**
 * Function that processes a test case.
 *
 * @template Input - Input type
 * @template ExpectedResult - Expected result type
 */
export type TestProcessor<Input, ExpectedResult> = (input: TestModel<Input, ExpectedResult>) => void | Promise<void>;


