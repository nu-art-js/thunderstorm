import {reduceToMap, removeFromArrayByIndex, testSuiteTester} from '../_main';
import {TestSuite_arrayToMap} from './cases/arrayToMap';
import {TestSuite_removeItemFromArray} from './cases/removeItemFromArray';
import {TestSuite_removeFromArray} from './cases/removeFromArray';
import {TestSuite_removeFromArrayByIndex} from './cases/removeFromArrayByIndex';
import {TestSuite_reduceToMap} from './cases/reduceToMap';

export const arrayToolsTests = {
	arrayToMap: () => testSuiteTester(TestSuite_arrayToMap),
	removeItemFromArray: () => testSuiteTester(TestSuite_removeItemFromArray),
	removeFromArray: () => testSuiteTester(TestSuite_removeFromArray),
	removeFromArrayByIndex: () => testSuiteTester(TestSuite_removeFromArrayByIndex),
	reduceToMap: () => testSuiteTester(TestSuite_reduceToMap),
};

export function runAllTests() {
	arrayToolsTests.arrayToMap();
	arrayToolsTests.removeItemFromArray();
	arrayToolsTests.removeFromArray();
	arrayToolsTests.removeFromArrayByIndex();
	arrayToolsTests.reduceToMap();
}