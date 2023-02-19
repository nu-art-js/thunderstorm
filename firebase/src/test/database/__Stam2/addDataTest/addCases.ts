/*
 * Firebase is a simpler Typescript wrapper to all of firebase services.
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

import {TestSuit_TS_addData} from "../types";
import {addData} from "../../test/add-data";

const TestCase_ts_AddData: TestSuit_TS_addData['testcases'] = [
    {
        description: 'Test 1',
        result: {name: "Alon"},
        input: {
            path: "/Desktop/red.txt",
            value: {name: "Alon"},
            label: "simple name object"
        }
    },
    {
        description: 'Test 2',
        result: "Alon",
        input: {
            path: "/Desktop/red.txt",
            value: "Alon",
            label: "simple name string"
        }
    },
    {
        description: 'Test 3',
        result: [1, 2, 3, 4, 5],
        input: {
            path: "/Desktop/red.txt",
            value: [1, 2, 3, 4, 5],
            label: "simple array"
        }
    }
];


export const TestSuit_ts_AddData: TestSuit_TS_addData = {
    label: 'Test add data',
    testcases: TestCase_ts_AddData,
    processor: (input) => addData(input)
};
