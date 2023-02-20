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

import { removeItemFromArray} from "../../../main";
import {TestSuit_TS_ArrayFunctionRemoveItem} from "../../types";

const emptyObj={};
const obj1={b:2,a:3};
const  obj2={a:2,b:3};
const TestCase_ts_RemoveItem:TestSuit_TS_ArrayFunctionRemoveItem<any>['testcases'] =[
    {
        description: 'Test 1',
        result: [1,2,3],
        input: {
            array: [1,2,3],
            item: 0
        }
    },
    {
        description: 'Test 2',
        result: [1,3],
        input: {
            array: [1,2,3],
            item: 2
        }
    },
    {
        description: 'Test 3',
        result: [2,3,1],
        input: {
            array: [1,2,3,1],
            item: 1
        }
    },
    {
        description: 'Test 4',
        result: [{},{}],
        input: {
            array: [emptyObj,{},{}],
            item: emptyObj
        }
    },
    {
        description: 'Test 5',
        result: [{a:2},{a:2},{a:2}],
        input: {
            array: [{a:2},{a:2},{a:2}],
            item: 2
        }
    },
    {
        description: 'Test 6',
        result: [{a:3},"b","a",{}],
        input: {
            array: [{a:3},"b","a",{}],
            item: "{}"
        }
    },
    {
        description: 'Test 7',
        result: [{a:3},{a:2},{a:{b:3}},{}],
        input: {
            array: [{a:3},{a:2},{a:{b:3}},{}],
            item: {b:3}
        }
    },
    {
        description: 'Test 8',
        result: [{a:3},{a:2},{a:{b:3}},{}],
        input: {
            array: [{a:3},{a:2},{a:{b:3}},{}],
            item: {a:3}
        }
    },
    {
        description: 'Test 9',
        result: ["b","c"],
        input: {
            array: ["a","b","c"],
            item: "a"
        }
    },
    {
        description: 'Test 10',
        result: [{a:4,b:5}],
        input: {
            array: [obj2,{a:4,b:5}],
            item: obj2
        }
    },
    {
        description: 'Test 11',
        result: [{b:5,a:4}],
        input: {
            array: [obj1,{a:4,b:5}],
            item: obj1
        }
    },
];

export const TestSuit_ts_removeItem: TestSuit_TS_ArrayFunctionRemoveItem= {
    label: 'Remove first similar item',
    testcases: TestCase_ts_RemoveItem,
    processor: (input) => removeItemFromArray(input.array, input.item)
};
