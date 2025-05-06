import {expect} from 'chai';
import {TestSuite} from '@nu-art/ts-common/testing/types';
import {testSuiteTester} from '@nu-art/ts-common/testing/consts';

// test input type - will have the parameters that actually makes a test case unique, its content depends on the test performed
export type Input = { inputA: string, inputB: number, inputC: any };

// test expected output type - (which may be a function - for complex logic checks)
// notice that the testsuite case allows a result or an error in case the processor throws an exception
// Both cases are handled in this example
export type Result = any;

// The testsuite type declaration
export type TestSuite_TemplateType = TestSuite<Input, Result>;

const justAGlobalConst = 'just a global const';
// the test cases, notice these can be a resolvable content, in order to keep bind consts between the input and the output,
const TestCase_Templates: TestSuite_TemplateType['testcases'] = [
	() => {
		const justAConst = 'case 1';
		return {
			description: `My very fancy test ${justAConst} - will pass with flying colors`,
			input: {
				inputA: `input for test ${justAConst}`,
				inputB: 1,
				inputC: ''
			},
			result: justAGlobalConst
		};
	},
	{
		description: 'My super fancy test case 2 - expected to fail',
		input: {
			inputA: 'input for test case 2',
			inputB: 2,
			inputC: ''
		},
		error: {
			expected: 'The expected error message'
		}
	}
];

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

// the testsuite declaration
export const Tests_TestCaseTemplate: TestSuite_TemplateType = {
	label: 'template',
	testcases: TestCase_Templates,

	// the actual test logic that will apply on all the testcases above
	processor: async (testCase) => {
		const input = testCase.input;

		if ('error' in testCase) {
			await expect(test(input)).to.be.rejectedWith(testCase.error.expected, testCase.error.message);
			return;
		}

		const output = await test(input);
		expect(output).to.deep.equal(testCase.result);
	}
};

// the mocha test launch
describe('template', () => {
	testSuiteTester(Tests_TestCaseTemplate);
});

