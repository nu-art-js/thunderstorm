import {TestModel, TestSuite} from './types';
import {expect} from 'chai';
import {ModuleManager} from '../core/module-manager';
import {voidFunction} from '../utils/tools';


export class ModuleManagerTester
	extends ModuleManager {
	constructor() {
		super();
	}
}

export function testSuite_RunTest<Input, ExpectedResult>(testSuit: TestSuite<Input, ExpectedResult>, testCase: TestModel<Input, ExpectedResult>) {
	it(testCase.description, () => testSuit.processor(testCase));
}

export const testSuiteTester = <Input, ExpectedResult>(testSuit: TestSuite<Input, ExpectedResult>, ...testcases: TestSuite<Input, ExpectedResult>['testcases']) => {
	describe(testSuit.label, () => {
		//Run pre-process
		if (testSuit.preProcessor) {
			it(`${testSuit.label} - Preprocessing`, testSuit.preProcessor);
		}

		(testcases.length > 0 ? testcases : testSuit.testcases).forEach(testCase => {
			testSuite_RunTest(testSuit, testCase);
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