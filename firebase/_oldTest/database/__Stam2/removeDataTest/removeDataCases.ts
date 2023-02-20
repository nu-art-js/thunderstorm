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

import {TestSuit_TS_addData, TestSuit_TS_removeData} from "../types";
import {addData} from "../../test/add-data";
import {removeData} from "../../test/remove-data";

const TestCase_ts_removeData: TestSuit_TS_removeData['testcases'] = [
    {
        description: 'Test 1',
        result: undefined,
        input: {
            //?????
        }
    },
];


export const TestSuit_ts_removeData: TestSuit_TS_removeData = {
    label: 'Test add data',
    testcases: TestCase_ts_removeData,
    processor: () => removeData()
};
