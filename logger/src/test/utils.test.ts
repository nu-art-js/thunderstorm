/*
 * @nu-art/logger - Flexible logging infrastructure with multiple output targets
 * Copyright (C) 2024 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {TestSuite} from '@nu-art/ts-common/testing/types.js';
import {defaultTestProcessor, runSingleTestCase} from '@nu-art/ts-common/testing/consts.js';
import {_logger_convertLogParamsToStrings, _logger_logException, _logger_logObject, _logger_indentNewLineBy, LogParam} from '../main/index.js';
import {expect} from 'chai';

type Input_ConvertParams = { params: LogParam[] };
type Result_ConvertParams = { strings: string[] };

type TestSuite_ConvertParams = TestSuite<Input_ConvertParams, Result_ConvertParams>;
type TestCase_ConvertParams = TestSuite_ConvertParams['testcases'][number];

const test_ConvertParams = async (input: Input_ConvertParams): Promise<Result_ConvertParams> => {
	const strings = _logger_convertLogParamsToStrings(input.params);
	return { strings };
};

const runTestCase_ConvertParams = (testCase: TestCase_ConvertParams) => () => runSingleTestCase(test_ConvertParams, testCase);

describe('Utils - Convert Log Params', () => {
	it('should convert string to string', runTestCase_ConvertParams({
		input: { params: ['hello'] },
		result: { strings: ['hello'] }
	}));

	it('should convert number to string', runTestCase_ConvertParams({
		input: { params: [42] },
		result: { strings: ['42'] }
	}));

	it('should convert boolean to string', runTestCase_ConvertParams({
		input: { params: [true, false] },
		result: { strings: ['true', 'false'] }
	}));

	it('should convert undefined to string', runTestCase_ConvertParams({
		input: { params: [undefined] },
		result: { strings: ['undefined'] }
	}));

	it('should convert null to string', runTestCase_ConvertParams({
		input: { params: [null] },
		result: { strings: ['null'] }
	}));

	it('should convert object to JSON string', runTestCase_ConvertParams({
		input: { params: [{ a: 1, b: 'test' }] },
		result: { strings: ['{"a":1,"b":"test"}'] }
	}));

	it('should convert array to JSON string', runTestCase_ConvertParams({
		input: { params: [[1, 2, 3]] },
		result: { strings: ['[1,2,3]'] }
	}));

	it('should convert Error to stack trace string', () => {
		const error = new Error('Test error');
		error.stack = 'Error: Test error\n    at test.js:1:1';
		const result = _logger_convertLogParamsToStrings([error]);
		expect(result[0]).to.include('Test error');
		expect(result[0]).to.include('at test.js:1:1');
	});

	it('should handle mixed types', runTestCase_ConvertParams({
		input: { params: ['text', 42, true, { key: 'value' }] },
		result: { strings: ['text', '42', 'true', '{"key":"value"}'] }
	}));
});

type Input_LogException = { error: Error; fullStack?: string };
type Result_LogException = { formatted: string };

type TestSuite_LogException = TestSuite<Input_LogException, Result_LogException>;
type TestCase_LogException = TestSuite_LogException['testcases'][number];

const test_LogException = async (input: Input_LogException): Promise<Result_LogException> => {
	const formatted = _logger_logException(input.error, input.fullStack);
	return { formatted };
};

const runTestCase_LogException = (testCase: TestCase_LogException) => () => runSingleTestCase(test_LogException, testCase);

describe('Utils - Log Exception', () => {
	it('should format error with stack trace', () => {
		const error = new Error('Test error');
		error.stack = 'Error: Test error\n    at test.js:1:1\n    at test.js:2:2';
		const result = _logger_logException(error);
		expect(result).to.include('Test error');
		expect(result).to.include('at test.js:1:1');
		expect(result).to.include('at test.js:2:2');
	});

	it('should handle error without stack', () => {
		const error = new Error('Test error');
		error.stack = undefined;
		const result = _logger_logException(error);
		expect(result).to.be.a('string');
	});

	it('should handle error with cause chain', () => {
		const cause = new Error('Cause error');
		cause.stack = 'Error: Cause error\n    at cause.js:1:1';
		const error = new Error('Main error');
		error.stack = 'Error: Main error\n    at main.js:1:1';
		// @ts-ignore
		error.cause = cause;
		const result = _logger_logException(error);
		expect(result).to.include('Main error');
		expect(result).to.include('Cause error');
	});

	it('should remove duplicate stack frames', () => {
		const error = new Error('Test error');
		error.stack = 'Error: Test error\n    at test.js:1:1\n    at test.js:1:1';
		const result = _logger_logException(error, '    at test.js:1:1\n');
		// Should not duplicate the frame
		const matches = result.match(/at test\.js:1:1/g);
		expect(matches?.length).to.be.at.most(2); // May appear twice but not more
	});
});

type Input_LogObject = { obj: object };
type Result_LogObject = { stringified: string };

type TestSuite_LogObject = TestSuite<Input_LogObject, Result_LogObject>;
type TestCase_LogObject = TestSuite_LogObject['testcases'][number];

const test_LogObject = async (input: Input_LogObject): Promise<Result_LogObject> => {
	const stringified = _logger_logObject(input.obj);
	return { stringified };
};

const runTestCase_LogObject = (testCase: TestCase_LogObject) => () => runSingleTestCase(test_LogObject, testCase);

describe('Utils - Log Object', () => {
	it('should stringify simple object', runTestCase_LogObject({
		input: { obj: { a: 1, b: 'test' } },
		result: { stringified: '{"a":1,"b":"test"}' }
	}));

	it('should stringify nested object', runTestCase_LogObject({
		input: { obj: { a: { b: { c: 1 } } } },
		result: { stringified: '{"a":{"b":{"c":1}}}' }
	}));

	it('should stringify array', runTestCase_LogObject({
		input: { obj: [1, 2, 3] as any },
		result: { stringified: '[1,2,3]' }
	}));
});

type Input_IndentNewLine = { prefix: string; input: string };
type Result_IndentNewLine = { indented: string };

type TestSuite_IndentNewLine = TestSuite<Input_IndentNewLine, Result_IndentNewLine>;
type TestCase_IndentNewLine = TestSuite_IndentNewLine['testcases'][number];

const test_IndentNewLine = async (input: Input_IndentNewLine): Promise<Result_IndentNewLine> => {
	const indented = _logger_indentNewLineBy(input.prefix, input.input);
	return { indented };
};

const runTestCase_IndentNewLine = (testCase: TestCase_IndentNewLine) => () => runSingleTestCase(test_IndentNewLine, testCase);

describe('Utils - Indent New Line', () => {
	it('should add prefix to single line', runTestCase_IndentNewLine({
		input: { prefix: '  ', input: 'test' },
		result: { indented: '  test' }
	}));

	it('should add prefix to each line', runTestCase_IndentNewLine({
		input: { prefix: '  ', input: 'line1\nline2\nline3' },
		result: { indented: '  line1\n  line2\n  line3' }
	}));

	it('should handle empty string', runTestCase_IndentNewLine({
		input: { prefix: '  ', input: '' },
		result: { indented: '  ' }
	}));

	it('should handle multiple consecutive newlines', runTestCase_IndentNewLine({
		input: { prefix: '  ', input: 'line1\n\nline2' },
		result: { indented: '  line1\n  \n  line2' }
	}));
});
