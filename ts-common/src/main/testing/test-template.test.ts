// test input type - will have the parameters that actually makes a test case unique, its content depends on the test performed
import {TestSuite} from './types';
import {defaultTestProcessor, runSingleTestCase} from './consts';

type Input = { inputA: string, inputB: number, inputC: any };

// test expected output type - (which may be a function - for complex logic checks)
// notice that the testsuite case allows a result or an error in case the processor throws an exception
// Both cases are handled in this example
type Result = any;

// The testsuite type declaration
type TestSuite_TemplateType = TestSuite<Input, Result>;
type TestCase_TemplateType = TestSuite_TemplateType['testcases'][number];

const justAGlobalConst = 'just a global const';
// the test cases, notice these can be a resolvable content, in order to keep bind consts between the input and the output,

const test = async (input: Input): Promise<Result> => {
	// the actual test logic that all test cases will pass through and all will yield the Result
	// this logic is silly but demonstrate the concept

	if (input.inputB === 2)
		throw new Error('a part of the error message would be The expected error message - but it\'s not the only part of the message');

	return iAmJustAHelperFunction();
};

// helper function - dedicated for this test suite
function iAmJustAHelperFunction() {
	return justAGlobalConst;
}

const runTestCase = (testCase: TestCase_TemplateType, processor?: typeof defaultTestProcessor) => () => runSingleTestCase(test, testCase, processor);

// the mocha test launch
describe('template', () => {
	it('My very fancy test', () => {
		const justAConst = 'case 1';

		return runTestCase({
			input: {
				inputA: `input for test ${justAConst}`,
				inputB: 1,
				inputC: ''
			},
			result: justAGlobalConst
		});
	});
	it('My super fancy test case 2 - expected to fail', () => {
		return runTestCase({
			input: {
				inputA: 'input for test case 2',
				inputB: 2,
				inputC: ''
			},
			error: {
				expected: 'The expected error message'
			}
		});
	});
});

