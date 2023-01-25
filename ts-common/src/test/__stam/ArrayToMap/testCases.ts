import {TestSuit_TS_ArrayFunctionArrayToMap, TestSuit_TS_ArrayFunctionRemoveItem} from "../types";
import {arrayToMap, removeItemFromArray} from "../../../main";


const TestCase_ts_arrayToMap: TestSuit_TS_ArrayFunctionArrayToMap<any>['testcases'] = [
    {
        description: 'Test 1',
        result: {0: 1, 1: 2, 2: 3},
        input: {
            array: [1, 2, 3],
            getKey: (item, index) => index,
            map: {}
        }
    },
    {
        description: 'Test 2',
        result: {0: 'zero', 1: 'one', 2: 'two'},
        input: {
            array: ['zero', 'one', 'two'],
            getKey: (item, index) => index,
            map: {}
        }
    },
];

export const TestSuit_ts_arrayToMap: TestSuit_TS_ArrayFunctionArrayToMap = {
    label: 'receives array and builds hashmap whom keys are decided via function and values are from array',
    testcases: TestCase_ts_arrayToMap,
    processor: (input) => arrayToMap(input.array, input.getKey, input.map)
};