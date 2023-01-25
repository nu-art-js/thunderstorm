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

import {TestSuit_TS_Merge} from "../../merge/types";
import {addItemToArray, flatArray, groupArrayBy, merge, padNumber} from "../../../../main";
import {TestSuit_TS_ArrayFunctionFlatArray, TestSuit_TS_ArrayFunctionGroupArrayBy} from "../../types";

const TestCase_ts_groupArrayBy: TestSuit_TS_ArrayFunctionGroupArrayBy<any>['testcases'] = [
    {
        description: 'Test 1',
        result: [{"key": "0", "values": [{"age": 0, gender: "male"}, {age: 0, gender: "female"}]}, {
            "key": "1",
            "values": [{"age": 1, gender: "male"}]
        }],
        input: {
            arr: [{age: 0, gender: "male"}, {age: 0, gender: "female"}, {age: 1, gender: "male"}],
            mapper: (item) => item.age
        }
    },
];
export const TestSuit_ts_groupArrayBy: TestSuit_TS_ArrayFunctionGroupArrayBy<any> = {
    label: 'group array by test',
    testcases: TestCase_ts_groupArrayBy,
    processor: input => groupArrayBy(input.arr, input.mapper)
};
