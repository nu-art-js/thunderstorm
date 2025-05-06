import {TestModel, TestSuite} from './types';
import chai, {expect} from 'chai';
import {ModuleManager} from '../core/module-manager';
import {resolveContent, voidFunction} from '../utils/tools';
import {MemStorage} from '../mem-storage/MemStorage';
import chaiAsPromised from 'chai-as-promised';
import {BeLogged} from '../core/logger/BeLogged';
import {LogClient_Terminal} from '../core/logger/LogClient_Terminal';
import {DebugFlag} from '../core/debug-flags';
import {LogLevel} from '../core/logger/types';
import {StaticLogger} from '../core/logger/Logger';

chai.use(chaiAsPromised);
BeLogged.addClient(LogClient_Terminal);
DebugFlag.DefaultLogLevel = LogLevel.Verbose;

export class ModuleManagerTester
	extends ModuleManager {
	constructor() {
		super();
	}
}


export function testSuite_RunTest<Input, ExpectedResult>(testSuit: TestSuite<Input, ExpectedResult>, testCase: TestModel<Input, ExpectedResult>) {
	it(resolveContent(testCase.description, testCase), () => testSuit.processor(testCase)).timeout(testSuit.timeout || 5000);
}

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