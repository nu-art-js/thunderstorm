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
import {TestSuit_ts_batchActionParallel} from "./testCases";

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

// Load chai-as-promised support
chai.use(chaiAsPromised);


describe(TestSuit_ts_batchActionParallel.label, () => {
    TestSuit_ts_batchActionParallel.testcases.forEach(testCase => {
        it(testCase.description, async () => {
            const result = await TestSuit_ts_batchActionParallel.processor(testCase.input);
            const expected = await testCase.result;
            expect(result).to.deep.equal(expected);
        });
    });
});

