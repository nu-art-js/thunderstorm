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

import {TestSuit, tsValidateArray, tsValidateExists, tsValidateOptional, tsValidateRegexp} from '../_main';
import {TestCase_Validator, validatorProcessor} from './_common';


export type ObjectWithArray = { prop1?: string[] }
export const objectWithArray0: ObjectWithArray = {};
export const objectWithArray1: ObjectWithArray = {prop1: []};
export const objectWithArray2: ObjectWithArray = {prop1: ['Adam']};
export const objectWithArray3: ObjectWithArray = {prop1: ['Adam', 'Yair']};

export const testSuit_objectWithArrayValidator: TestSuit<TestCase_Validator<any>> = {
	key: 'object-validator--object-with-array',
	label: 'Object Validator - Object With Array',
	processor: validatorProcessor,
	models: [
		{expected: 'pass', input: {instance: objectWithArray0, validator: {prop1: tsValidateOptional}}},
		{expected: 'pass', input: {instance: objectWithArray0, validator: {prop1: tsValidateExists(false)}}},
		{expected: 'fail', input: {instance: objectWithArray0, validator: {prop1: tsValidateExists(true)}}},
		{expected: 'pass', input: {instance: objectWithArray0, validator: {prop1: tsValidateArray(tsValidateRegexp(/Adam/), false)}}},
		{expected: 'pass', input: {instance: objectWithArray1, validator: {prop1: tsValidateArray(tsValidateRegexp(/Adam/))}}},
		{expected: 'pass', input: {instance: objectWithArray1, validator: {prop1: tsValidateArray(tsValidateRegexp(/pah/))}}},
		{expected: 'pass', input: {instance: objectWithArray2, validator: {prop1: tsValidateArray(tsValidateRegexp(/Adam/))}}},
		{expected: 'fail', input: {instance: objectWithArray2, validator: {prop1: tsValidateArray(tsValidateRegexp(/pah/))}}},
		{expected: 'pass', input: {instance: objectWithArray3, validator: {prop1: tsValidateArray(tsValidateRegexp(/Adam|Yair/))}}},
		{expected: 'fail', input: {instance: objectWithArray3, validator: {prop1: tsValidateArray(tsValidateRegexp(/pah/))}}},
	]
};
