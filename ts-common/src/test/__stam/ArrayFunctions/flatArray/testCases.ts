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
import {flatArray, merge} from "../../../../main";
import {TestSuit_TS_ArrayFunctionFlatArray} from "../../types";

const TestCase_ts_flatArray: TestSuit_TS_ArrayFunctionFlatArray['testcases'] = [
    {
        description: 'Test 1',
        result: [1, 2, 3, 5, 6, 7],
        input: {
            arr: [[1, 2, 3], [5, 6, 7]],
            result: []
        }
    },
];
export const TestSuit_ts_flatArray: TestSuit_TS_ArrayFunctionFlatArray = {
    label: 'flat array test',
    testcases: TestCase_ts_flatArray,
    processor: input => flatArray(input.arr, input.result)
};