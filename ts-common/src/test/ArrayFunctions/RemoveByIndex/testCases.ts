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

import {TestSuit_TS_ArrayFunctionRemoveByIndex} from '../../types';
import {removeFromArrayByIndex} from '../../../main';


const TestCase_ts_removeByIndex: TestSuit_TS_ArrayFunctionRemoveByIndex['testcases'] = [
	{
		description: 'Test 1',
		result: [1, 2, 3],
		input: {
			array: [0, 1, 2, 3],
			index: 0
		}
	},
	{
		description: 'Test 2',
		result: [],
		input: {
			array: [0],
			index: 0
		}
	},
	{
		description: 'Test 3',
		result: [0],
		input: {
			array: [0],
			index: 1
		}
	},
	{
		description: 'Test 4',
		result: [1, 3],
		input: {
			array: [1, 2, 3],
			index: 1
		}
	},
	{
		description: 'Test 5',
		result: [],
		input: {
			array: [],
			index: 1
		}
	},
	{
		description: 'Test 6',
		result: [1, 2, 3],
		input: {
			array: [1, 2, 3],
			index: -21
		}
	},
	{
		description: 'Test 7',
		result: [{}, {}, {}],
		input: {
			array: [{}, {}, {}, {}],
			index: 2
		}
	},
];

export const TestSuit_ts_removeByIndex: TestSuit_TS_ArrayFunctionRemoveByIndex = {
	label: 'Remove By Index Test',
	testcases: TestCase_ts_removeByIndex,
	processor: (input) => removeFromArrayByIndex(input.array, input.index)
};
