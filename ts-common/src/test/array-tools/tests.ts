import {testSuiteTester} from '../_main';
import {TestSuite_arrayToMap} from './cases/arrayToMap';
import {TestSuite_removeItemFromArray} from './cases/removeItemFromArray';
import {TestSuite_removeFromArray} from './cases/removeFromArray';
import {TestSuite_removeFromArrayByIndex} from './cases/removeFromArrayByIndex';
import {TestSuite_reduceToMap} from './cases/reduceToMap';
import {TestSuite_filterFalsy} from './cases/filterFalsy';
import {TestSuite_groupArrayBy} from './cases/groupArrayBy';
import {TestSuite_batchAction} from './cases/batchAction';
import {TestSuite_batchActionParallel} from './cases/batchActionParallel';
import {TestSuite_filterAsync} from './cases/filterAsync';
import {TestSuite_filterDuplicates} from './cases/filterDuplicates';
import {TestSuite_findDuplicates} from './cases/findDuplicates';
import {TestSuite_flatArray} from './cases/flatArray';
import {TestSuite_sortArray} from './cases/sortArray';

export const arrayToolsTests = {
	arrayToMap: () => testSuiteTester(TestSuite_arrayToMap),
	removeItemFromArray: () => testSuiteTester(TestSuite_removeItemFromArray),
	removeFromArray: () => testSuiteTester(TestSuite_removeFromArray),
	removeFromArrayByIndex: () => testSuiteTester(TestSuite_removeFromArrayByIndex),
	reduceToMap: () => testSuiteTester(TestSuite_reduceToMap),
	filterFalsy: () => testSuiteTester(TestSuite_filterFalsy),
	groupArrayBy: () => testSuiteTester(TestSuite_groupArrayBy),
	batchAction: () => testSuiteTester(TestSuite_batchAction),
	batchActionParallel: () => testSuiteTester(TestSuite_batchActionParallel),
	filterAsync: () => testSuiteTester(TestSuite_filterAsync),
	filterDuplicates: () => testSuiteTester(TestSuite_filterDuplicates),
	findDuplicates: () => testSuiteTester(TestSuite_findDuplicates),
	flatArray: () => testSuiteTester(TestSuite_flatArray),
	sortArray: () => testSuiteTester(TestSuite_sortArray),
};

export function runAllArrayToolsTests() {
	arrayToolsTests.arrayToMap();
	arrayToolsTests.removeItemFromArray();
	arrayToolsTests.removeFromArray();
	arrayToolsTests.removeFromArrayByIndex();
	arrayToolsTests.reduceToMap();
	arrayToolsTests.filterFalsy();
	arrayToolsTests.groupArrayBy();
	arrayToolsTests.batchAction();
	arrayToolsTests.batchActionParallel();
	arrayToolsTests.filterAsync();
	arrayToolsTests.filterDuplicates();
	arrayToolsTests.findDuplicates();
	arrayToolsTests.flatArray();
	arrayToolsTests.sortArray();
}