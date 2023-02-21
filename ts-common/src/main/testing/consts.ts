import {TestSuite} from './types';
import {expect} from 'chai';
import {voidFunction} from '..';

export const testSuitTester = <Input, ExpectedResult>(testSuit: TestSuite<Input, ExpectedResult>) => {
	describe(testSuit.label, () => {
		testSuit.testcases.forEach(testCase => {
			it(testCase.description, async () => testSuit.processor(testCase));
		});
	});
};

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