import {testSuiteTester} from '../_main';
import {TestSuite_compare} from './cases/compare';

export const objectToolsTests = {
	compare: () => testSuiteTester(TestSuite_compare),
};

export function runAllObjectToolsTests() {
	objectToolsTests.compare();
}