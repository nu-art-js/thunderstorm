import {TestSuit} from './types';

export const testSuitTester = <Input, ExpectedResult>(testSuit: TestSuit<Input, ExpectedResult>) => {
	describe(testSuit.label, () => {
		testSuit.testcases.forEach(testCase => {
			it(testCase.description, async () => testSuit.processor(testCase));
		});
	});
};