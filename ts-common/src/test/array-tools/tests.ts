import {reduceToMap, removeFromArrayByIndex, testSuitTester} from '../_main';
import {TestSuite_arrayToMap} from './cases/arrayToMap';
import {TestSuite_removeItemFromArray} from './cases/removeItemFromArray';
import {TestSuite_removeFromArray} from './cases/removeFromArray';
import {TestSuite_removeFromArrayByIndex} from './cases/removeFromArrayByIndex';
import {TestSuite_reduceToMap} from './cases/reduceToMap';

export const arrayToolsTests = {
	arrayToMap: () => testSuitTester(TestSuite_arrayToMap),
	removeItemFromArray: () => testSuitTester(TestSuite_removeItemFromArray),
	removeFromArray: () => testSuitTester(TestSuite_removeFromArray),
	removeFromArrayByIndex: () => testSuitTester(TestSuite_removeFromArrayByIndex),
	reduceToMap: () => testSuitTester(TestSuite_reduceToMap),
};

export function runAllTests() {
	arrayToolsTests.arrayToMap();
	arrayToolsTests.removeItemFromArray();
	arrayToolsTests.removeFromArray();
	arrayToolsTests.removeFromArrayByIndex();
	arrayToolsTests.reduceToMap();
}