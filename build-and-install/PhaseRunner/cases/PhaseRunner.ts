import {expect} from 'chai';
import {TestSuite} from '@nu-art/ts-common/test-index';

type Input = {}
type Result = any


type TestSuite_PhaseRunner = TestSuite<Input, Result>;

const TestCase_PhaseRunner: TestSuite_PhaseRunner['testcases'] = [];
const test = (input: Input): Result => {
	// write your test here
};

export const TestSuite_PhaseRunner: TestSuite_PhaseRunner = {
	label: 'PhaseRunner',
	testcases: TestCase_PhaseRunner,
	processor: async (testCase) => {
		const input = testCase.input;
		const expected = testCase.result;

		const result = test(input);
		expect(result).to.deep.equals(expected);
	}
};