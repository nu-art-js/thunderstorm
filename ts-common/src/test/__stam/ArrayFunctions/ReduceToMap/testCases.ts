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

import {TestSuit_TS_ArrayFunctionReduceToMap} from "../../types";
import {reduceToMap} from "../../../../main";


const TestCase_ts_ReduceToMap: TestSuit_TS_ArrayFunctionReduceToMap<any>['testcases'] = [
    {
        description: 'Test 1',
        result: {Alon: 27, Itay: 28},
        input: {
            array: [{name: 'Alon', age: 27}, {name: 'Itay', age: 28}],
            keyResolver: (item: { name: string, age: number }) => item.name,
            mapper: (item: { name: string, age: number }) => item.age,
            map: {}
        }
    },
    {
        description: 'Test 2',
        result: {Alon: 0, Itay: 1},
        input: {
            array: ['Alon', 'Itay'],
            keyResolver: (item: string) => item,
            mapper: (item, index) => index,
            map: {}
        }
    },
];


export const TestSuit_ts_reduceToMap: TestSuit_TS_ArrayFunctionReduceToMap<any> = {
    label: 'turn array into "hash map"',
    testcases: TestCase_ts_ReduceToMap,
    processor: (input) => reduceToMap(input.array, input.keyResolver, input.mapper, input.map)
};