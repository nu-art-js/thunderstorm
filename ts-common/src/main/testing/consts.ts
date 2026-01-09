import {TestCase_Error, TestModel, TestResetListener, TestSuite} from './types.js';
import chai, {expect} from 'chai';
import {ModuleManager} from '../core/module-manager.js';
import {exists, resolveContent, voidFunction} from '../utils/tools.js';
import {MemStorage} from '../mem-storage/MemStorage.js';
import chaiAsPromised from 'chai-as-promised';
import {BeLogged} from '../core/logger/BeLogged.js';
import {LogClient_Terminal} from '../core/logger/LogClient_Terminal.js';
import {DebugFlag} from '../core/debug-flags.js';
import {LogLevel} from '../core/logger/types.js';
import {StaticLogger} from '../core/logger/Logger.js';
import {BadImplementationException} from '../core/exceptions/exceptions.js';
import {Dispatcher} from '../core/dispatcher.js';
import {Void} from '../utils/types.js';

chai.use(chaiAsPromised);
BeLogged.addClient(LogClient_Terminal);
DebugFlag.DefaultLogLevel = LogLevel.Verbose;

export class ModuleManagerTester
	extends ModuleManager {
	constructor() {
		super();
	}
}


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
 * Configures `before()` and `after()` hooks if provided, and runs each test case
 * in its own MemStorage context for isolation.
 *
 * **Note**: Each test case runs in a fresh MemStorage context to prevent
 * state leakage between tests.
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
			StaticLogger.logDebug(testSuit.label, '-----  Before Finished  -----');
		});

	(testcases.length > 0 ? testcases : testSuit.testcases).forEach(testCase => {
		new MemStorage().init(async () => testSuite_RunTest(testSuit, resolveContent(testCase)));
	});


	//Run pre-process
	if (testSuit.after)
		after(() => {
			StaticLogger.logDebug(testSuit.label, '-----  After Started  -----');
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
	if (!exists(expectedResult) && !exists(error))
		throw new BadImplementationException('MUST provide expectedResult or error');

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
 * Resolves the test case, extracts expected result or error, and runs the test
 * in a fresh MemStorage context.
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
	await new MemStorage().init(async () => processor(test(testCase.input), expectedResult, error));
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

/**
 * Dispatcher for resetting modules between tests.
 *
 * Modules implementing `TestResetListener` can register to receive reset calls
 * via this dispatcher. The test framework calls this to reset module state.
 */
export const dispatcher_resetTests = new Dispatcher<TestResetListener, '__resetForTests'>('__resetForTests');
