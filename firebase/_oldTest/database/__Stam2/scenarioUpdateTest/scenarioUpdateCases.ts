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


import {scenarioUpdate} from "../../test/add-data";
import {TestSuit_TS_scenarioUpdate} from "../types";


const TestCase_ts_scenarioUpdate: TestSuit_TS_scenarioUpdate['testcases'] = [
    {
        description: 'Test 1',
        result: {
            path: "/Desktop/green.txt",
            value: {name: "Alon", age: 22},
            label: "simple name object"
        },
        input: {
            obj1: {
                path: "/Desktop/green.txt",
                value: {name: "Alon", age: 27},
                label: "simple name object"
            },
            obj2: {
                path: "/Desktop/green.txt",
                value: {name: "Alon", age: 22},
                label: "simple name object"
            }
        }
    }
];


export const TestSuit_ts_scenarioUpdate: TestSuit_TS_scenarioUpdate = {
    label: 'Test scenario update',
    testcases: TestCase_ts_scenarioUpdate,
    processor: (input) => scenarioUpdate(input.obj1, input.obj2)
};
