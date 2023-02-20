import {TestSuit_TS_ArrayFunctionSortArray} from '../types';
import {sortArray} from '../../main';


const TestCase_ts_sortArray: TestSuit_TS_ArrayFunctionSortArray<any>['testcases'] = [
    {
        description: 'Test 1',
        result: [{name: 'Adam', shoeSize: 45}, {name: 'Alon', shoeSize: 47.5}, {name: 'Itay', shoeSize: 50}],
        input: {
            array: [{name: 'Alon', shoeSize: 47.5}, {name: 'Itay', shoeSize: 50}, {name: 'Adam', shoeSize: 45}],
            map: (item: { name: string, shoeSize: number }) => item.shoeSize,
            invert: false
        }
    },
];


export const TestSuit_ts_sortArray: TestSuit_TS_ArrayFunctionSortArray = {
    label: 'sorts array',
    testcases: TestCase_ts_sortArray,
    processor: (input) => sortArray(input.array, input.map, input.invert)
};