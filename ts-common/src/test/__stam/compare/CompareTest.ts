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

import {expect} from 'chai';
import {compare} from '../../../main';
import {TestSuitV2} from '../types';


export function runTestSuitV2(testSuit: TestSuitV2) {
	describe(testSuit.label, () => {
		testSuit.testcases.forEach(testCase => {
			it(testCase.description, () => {
				expect(compare(testCase.input.one, testCase.input.two)).to.eq(testCase.answer);
			});
		});
	});
}