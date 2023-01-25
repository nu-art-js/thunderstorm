import {TestSuit_TS_ArrayFunctionFilterAsync} from "../../types";
import {filterAsync} from "../../../../main";

const TestCase_ts_FilterAsync: TestSuit_TS_ArrayFunctionFilterAsync<any>['testcases'] = [
    {
        description: 'Test 1',
        result: [2, 4, 6],
        input: {
            array: [1, 2, 3, 4, 5, 6, 7],
            filter: async (n: number) => n % 2 === 0
        }
    },
    {
        description: 'Test 2',
        result: [3, 4, 5, 6, 7],
        input: {
            array: ["1", "{}", 3, 4, 5, 6, 7],
            filter: async (n: any) => typeof n !== 'string'
        }
    },
    {
        description: 'Test 3',
        result: [{}, {a: 5}, {b: 5}],
        input: {
            array: [1, 2, {}, {a: 5}, {b: 5}],
            filter: async (n: any) => typeof n === 'object'
        }
    },
    {
        description: 'Test 4',
        result: ['one', 5,],
        input: {
            array: ['one', {a: 3}, 5, {}],
            filter: async (item: any) => typeof item !== 'object'
        }
    },
];


export const TestSuit_ts_filterAsync: TestSuit_TS_ArrayFunctionFilterAsync = {
    label: 'Removes all items answering the condition in given from array ',
    testcases: TestCase_ts_FilterAsync,
    processor: async (input) => await filterAsync(input.array, input.filter)
};