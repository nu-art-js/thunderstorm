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

import {
	ValidatorTest,
} from "./test";
import {
	tsValidateRange,
	tsValidateRegexp,
	tsValidateValue,
	TestSuit
} from "../_main";
import {validatorProcessor} from "./_common";

type SubNestedObject = object & {
	prop3?: string;
	prop4?: number;
}
type NestedObject = {
	prop1?: string;
	prop2?: SubNestedObject;
}

const nestedObject1: NestedObject = {prop1: "Adam", prop2: {prop3: "pah", prop4: 71070}};
const nestedObject2: NestedObject = {prop1: "Adam", prop2: undefined};
const nestedObject3: NestedObject = {prop1: "Adam"};

export const testSuit_nestedObjectValidator: TestSuit<ValidatorTest<NestedObject>> = {
	key: "object-validator--nested-object",
	label: "Object Validator - Nested Object",
	processor: validatorProcessor,
	models: [{expected: "fail", input: {instance: nestedObject1, validator: {}}},
		{expected: "fail", input: {instance: nestedObject1, validator: {prop1: tsValidateRegexp(/PaH/)}}},
		{expected: "fail", input: {instance: nestedObject1, validator: {prop1: tsValidateRegexp(/Adam/)}}},
		{expected: "fail", input: {instance: nestedObject1, validator: {prop1: tsValidateRegexp(/Adam/)}}},
		{expected: "fail", input: {instance: nestedObject2, validator: {prop1: tsValidateRegexp(/Adam/)}}},
		{expected: "fail", input: {instance: nestedObject1, validator: {prop1: tsValidateRegexp(/Adam/), prop2: {}}}},
		{expected: "fail", input: {instance: nestedObject1, validator: {prop1: tsValidateRegexp(/Adam/), prop2: {prop3: tsValidateValue(["zevel"])}}}},
		{expected: "fail", input: {instance: nestedObject1, validator: {prop1: tsValidateRegexp(/Adam/), prop2: {prop3: tsValidateValue(["pah"])}}}},
		{
			expected: "fail", input: {
				instance: nestedObject1, validator: {
					prop1: tsValidateRegexp(/Adam/), prop2: {prop3: tsValidateValue(["pah", "zevel"]), prop4: tsValidateRange([[10, 30]])}
				}
			}
		},
		{
			expected: "pass", input: {
				instance: nestedObject1, validator: {
					prop1: tsValidateRegexp(/Adam/), prop2: {prop3: tsValidateValue(["pah", "zevel"]), prop4: tsValidateRange([[10, 80000]])}
				}
			}
		},
		{expected: "pass", input: {instance: nestedObject3, validator: {prop1: tsValidateRegexp(/Adam/)}}},
	]
};
