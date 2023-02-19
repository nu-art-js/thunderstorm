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

import {TestSuit_TS_FB_delete} from "../types";
import {testInstance1} from "../../../../_oldTest/test/firestore/collection/_core/consts";

const TestCase_ts_FB_delete: TestSuit_TS_FB_delete ['testcases'] = [
    {
        description: 'Test 1',
        result: 1,
        input: {
            path: "aa",
            testCase: testInstance1
        }
    },
];

export const TestSuit_ts_FB_delete: TestSuit_TS_FB_delete = {
    label: 'deletes from firebase',
    testcases: TestCase_ts_FB_delete,
};