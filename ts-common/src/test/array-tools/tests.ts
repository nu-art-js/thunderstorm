import {testSuitTester} from '../_main';
import {TestSuite_arrayToMap} from './cases/arrayToMap';
import {TestSuite_removeItemFromArray} from './cases/removeItemFromArray';

export const arrayToolsTests = {
	arrayToMap: () => testSuitTester(TestSuite_arrayToMap),
	removeItemFromArray: () => testSuitTester(TestSuite_removeItemFromArray),
};

export function runAllTests() {
	arrayToolsTests.arrayToMap();
	arrayToolsTests.removeItemFromArray();
}