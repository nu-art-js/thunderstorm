import {TestSuite} from './types';
import {expect} from 'chai';
import {voidFunction} from '..';

export const testSuiteTester = <Input, ExpectedResult>(testSuit: TestSuite<Input, ExpectedResult>) => {
	describe(testSuit.label, () => {
		//Run pre-process
		if (testSuit.preProcessor) {
			it(`${testSuit.label} - Preprocessing`, testSuit.preProcessor);
		}

		testSuit.testcases.forEach(testCase => {
			it(testCase.description,  () => testSuit.processor(testCase));
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