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

import {
    TestSuit_TS_ArrayFunctionRemoveFromArray
} from "../../types";
import {removeFromArray} from "../../../main";



const TestCase_ts_removeFromArray:TestSuit_TS_ArrayFunctionRemoveFromArray<any>['testcases'] =[
    {
        description: 'Test 1',
        result: [1,3],
        input: {
            array: [1,2,3],
            item: (item) => item % 2 === 0
        }
    },
    {
        description: 'Test 2',
        result: [4,8,10],
        input: {
            array: [4,8,10,9],
            item: (item) => item % 2 === 1
        }
    },
    {
        description: 'Test 3',
        result: [{a:1},{a:2}],
        input: {
            array: [{a:1},{a:2},{a:3}],
            item: (item) => JSON.stringify(item) === JSON.stringify({a:3})
        }
    },
    {
        description: 'Test 4',
        result: ['one','two'],
        input: {
            array: ['one','two','three'],
            item: (item) => item === 'three'
        }
    },
    {
        description: 'Test 5',
        result: [{a:1},{a:2},{b:5,a:3}],
        input: {
            array: [{a:1},{a:2},{b:5,a:3}],
            item: (item) => JSON.stringify(item) === JSON.stringify({a:3,b:5})
        }
    },
];




export const TestSuit_ts_removeFromArray: TestSuit_TS_ArrayFunctionRemoveFromArray= {
    label: 'Removes the first item answering the condition given from array in place ',
    testcases: TestCase_ts_removeFromArray,
    processor: (input) => removeFromArray(input.array,input.item)
};
