import {testSuiteTester} from '../_main';
import {TestSuite_merge, TestSuite_mergeFail} from './cases/merge';

export const mergeToolsTests = {
	merge: () => testSuiteTester(TestSuite_merge),
	mergeFail: () => testSuiteTester(TestSuite_mergeFail),
};

export function runAllMergeToolsTests() {
	mergeToolsTests.merge();
	mergeToolsTests.mergeFail();
}