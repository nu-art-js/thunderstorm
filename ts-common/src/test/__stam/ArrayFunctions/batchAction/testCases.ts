import {TestSuit_TS_ArrayFunctionBatchAction, TestSuit_TS_ArrayFunctionRemoveFromArray} from "../../types";
import {batchAction} from "../../../../main";


const TestCase_ts_batchAction: TestSuit_TS_ArrayFunctionBatchAction<any>['testcases'] = [
    {
        description: 'Test 1',
        result: Promise.resolve([3, 6, 9, 12, 15]),
        input: {
            arr: [1, 2, 3, 4, 5],
            chunk: 2,
            action: async (item: number[]) => {
                return item.map(x => x * 3);
            }
        }
    },
    {
        description: 'Test 2',
        result: Promise.resolve([null, {}, {}, {}]),
        input: {
            arr: [5, {}, {}, {}],
            chunk: 2,
            action: async (item: number[]) => {
                return item.map(x => {
                    if (typeof x !== "object")
                        return null;
                    return x;
                });
            }
        }
    },
    {
        description: 'Test 3',
        result: Promise.resolve([1, 4, 9, 16, 25]),
        input: {
            arr: [1, 2, 3, 4, 5],
            chunk: 2,
            action: async (item: number[]) => {
                return item.map(x => x * x);
            }
        }
    },
    {
        description: 'Test 4',
        result: Promise.resolve(['a', 'c', 'b', 'z']),
        input: {
            arr: ['c', 'a', 'b', 'z'],
            chunk: 2,
            action: async (item: string[]) => {
                return item.sort();
            }
        }
    },
    {
        description: 'Test 5',
        result: Promise.resolve(['a', 'b', 'c', 'z']),
        input: {
            arr: ['c', 'a', 'b', 'z'],
            chunk: 3,
            action: async (item: string[]) => {
                return item.sort();
            }
        }
    },
];


export const TestSuit_ts_batchAction: TestSuit_TS_ArrayFunctionBatchAction = {
    label: 'Test batch action ',
    testcases: TestCase_ts_batchAction,
    processor: (input) => batchAction(input.arr, input.chunk, input.action)
};
