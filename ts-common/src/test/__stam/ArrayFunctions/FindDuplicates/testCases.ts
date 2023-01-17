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

import {TestSuit_TS_ArrayFunctionFindDuplicates, TestSuit_TS_ArrayFunctionRemoveItem} from "../../types";
import {findDuplicates} from "../../../../main";

const emptyObj={}

const TestCase_ts_FindDuplicates:TestSuit_TS_ArrayFunctionFindDuplicates<any>['testcases'] =[
    {
        description: 'Test 1',
        result: [1,2,3],
        input: {
            array1: [1,2,3],
            array2: [1,2,3,4]
        }
    },
    {
        description: 'Test 2',
        result: [emptyObj],
        input: {
            array1: [emptyObj],
            array2: [emptyObj]
        }
    },
    {
        description: 'Test 3',
        result: [1,2,3,4,5],
        input: {
            array1: [1,2,3,4,5],
            array2: [5,4,3,2,1]
        }
    },
    {
        description: 'Test 4',
        result: [1,5,1],
        input: {
            array1: [1,2,3,4,5,1],
            array2: [5,1]
        }
    },
    {
        description: 'Test 5',
        result: [5,1,5],
        input: {
            array1: [5,1,5],
            array2: [5,1,1,1,1]
        }
    },
    {
        description: 'Test 6',
        result: [],
        input: {
            array1: [1,'a',],
            array2: [2,3,'b']
        }
    },
    {
        description: 'Test 7',
        result: [1,1,1,1,1,1,1,1,1],
        input: {
            array1: [1,1,1,1,1,1,1,1,1],
            array2: [1]
        }
    }


];

export const TestSuit_ts_findDuplicates: TestSuit_TS_ArrayFunctionFindDuplicates= {
    label: 'Find similar items in 2 arrays and return in array',
    testcases: TestCase_ts_FindDuplicates,
    processor: (input) => findDuplicates(input.array1, input.array2)
};