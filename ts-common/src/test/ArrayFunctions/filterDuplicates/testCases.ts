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

import {TestSuit_TS_ArrayFunctionFilterDuplicates, TestSuit_TS_ArrayFunctionRemoveItem} from "../../types";
import {filterDuplicates} from "../../../main";
import {matchesAny} from "typedoc/dist/lib/utils/paths";


const TestCase_ts_FilterDuplicates:TestSuit_TS_ArrayFunctionFilterDuplicates['testcases'] =[
    {
        description: 'Test 1',
        result: [1,2,3],
        input: {
            source: [1,2,3],
            mapper: undefined
        }
    },
    {
        description: 'Test 2',
        result: [1,2,3],
        input: {
            source: [1,2,3,3],
            mapper: undefined
        }
    },
    {
        description: 'Test 3',
        result: [1,2,'abc'],
        input: {
            source: [1,2,'abc','abc'],
            mapper: undefined //don't fully understand how to create mapper
        }
    },
    {
        description: 'Test 4',
        result: [1,2,{},{}],
        input: {
            source: [1,2,{},{}],
            mapper: undefined
        }
    },
    {
        description: 'Test 5',
        result: [{a:2},{a:{b:3}},{a:3,b:2}],
        input: {
            source: [{a:2},{a:2,b:2},{a:{b:3}},{a:3,b:2}],
            mapper: (item)=> item.a
        }
    },
];
export const TestSuit_ts_filterDuplicates: TestSuit_TS_ArrayFunctionFilterDuplicates= {
    label: 'Remove duplicate items from array',
    testcases: TestCase_ts_FilterDuplicates,
    processor: (input) => filterDuplicates(input.source, input.mapper)
};