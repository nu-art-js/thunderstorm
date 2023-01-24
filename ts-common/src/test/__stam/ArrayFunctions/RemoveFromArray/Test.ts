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


import {expect} from "chai";
import {TestSuit_ts_removeFromArray} from "./testCases";

//describe(TestSuit_ts_removeFromArray.label, () => {
//     TestSuit_ts_removeFromArray.testcases.forEach(testCase => {
//         it(testCase.description, () => {
//             expect(TestSuit_ts_removeFromArray.processor(testCase.input)).to.eql(testCase.result);
//         });
//     });
// });


describe(TestSuit_ts_removeFromArray.label, () => {
    TestSuit_ts_removeFromArray.testcases.forEach(testCase => {
        it(testCase.description, () => {
            const result = TestSuit_ts_removeFromArray.processor(testCase.input);
            const expected = testCase.result;
            expect(result).to.eql(expected);
        });
    });
});



