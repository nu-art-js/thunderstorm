/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {TestSuit_TS_ArrayFunctionBatchAction, TestSuit_TS_ArrayFunctionRemoveFromArray} from "../../types";
import {batchAction, batchActionParallel} from "../../../main";


const TestCase_ts_batchActionParallel: TestSuit_TS_ArrayFunctionBatchAction<any>['testcases'] = [
    {
        description: 'Test 1',
        result: Promise.resolve([2, 4, 6, 8, 10]),
        input: {
            arr: [1, 2, 3, 4, 5],
            chunk: 2,
            action: async (item: number[]) => {
                return item.map(x => x * 2);
            }
        }
    },
    {
        description: 'Test 2',
        result: Promise.resolve([1, 2, 3, 4, 5, null, null, null]),
        input: {
            arr: [1, 2, 3, 4, 5, {}, {}, {}],
            chunk: 2,
            action: async (item: number[]) => {
                return item.map(x => {
                    if (typeof x === "object")
                        return null;
                    return x;
                });
            }
        }
    },
    {
        description: 'Test 3',
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
        description: 'Test 4',
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


export const TestSuit_ts_batchActionParallel: TestSuit_TS_ArrayFunctionBatchAction = {
    label: 'Testing batch action parallel ',
    testcases: TestCase_ts_batchActionParallel,
    processor: async (input) => await batchActionParallel(input.arr, input.chunk, input.action)
};
