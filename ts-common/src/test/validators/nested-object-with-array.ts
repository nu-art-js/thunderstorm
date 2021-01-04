/*
 * ts-common is the basic building blocks of our typescript projects
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {ValidatorTest,} from "./test";
import {
	validateArray,
	validateRegexp,
	TestSuit
} from "../_main";
import {
	ObjectWithArray,
	objectWithArray1,
	objectWithArray2,
	objectWithArray3
} from "./object-with-array";
import {validatorProcessor} from "./_common";

type ObjectWithNestedArray = { prop2: ObjectWithArray }
const objectWithNestedArray0: ObjectWithNestedArray = {prop2: objectWithArray1};
const objectWithNestedArray1: ObjectWithNestedArray = {prop2: objectWithArray2};
const objectWithNestedArray2: ObjectWithNestedArray = {prop2: objectWithArray3};

export const testSuit_nestedObjectWithArrayValidator: TestSuit<ValidatorTest<ObjectWithNestedArray>> = {
	key: "object-validator--nested-object-with-array",
	label: "Object Validator - Nested Object With Array",
	processor: validatorProcessor,
	models: [
		{expected: "pass", input: {instance: objectWithNestedArray0, validator: {prop2: {prop1: validateArray(validateRegexp(/Adam/))}}}},
		{expected: "pass", input: {instance: objectWithNestedArray0, validator: {prop2: {prop1: validateArray(validateRegexp(/pah/))}}}},
		{expected: "pass", input: {instance: objectWithNestedArray1, validator: {prop2: {prop1: validateArray(validateRegexp(/Adam/))}}}},
		{expected: "fail", input: {instance: objectWithNestedArray1, validator: {prop2: {prop1: validateArray(validateRegexp(/pah/))}}}},
		{expected: "pass", input: {instance: objectWithNestedArray2, validator: {prop2: {prop1: validateArray(validateRegexp(/Adam|Yair/))}}}},
		{expected: "fail", input: {instance: objectWithNestedArray2, validator: {prop2: {prop1: validateArray(validateRegexp(/pah/))}}}},
	]
};
