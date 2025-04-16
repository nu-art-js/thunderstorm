import {expect} from 'chai';
import {compare, TestSuite} from '../../_main';

type Input = {}
type Result = any


type TestSuite_testSuiteName = TestSuite<Input, Result>;

const TestCase_testSuiteName: TestSuite_testSuiteName['testcases'] = [];
const test = (input: Input): Result => {
	// write your test here
};

export const TestSuite_testSuiteName: TestSuite_testSuiteName = {
	label: 'testSuiteName',
	testcases: TestCase_testSuiteName,
	processor: async (testCase) => {
		const input = testCase.input;
		const expected = testCase.result;

		const result = test(input);
		expect(result).to.deep.equals(expected);
	}
};