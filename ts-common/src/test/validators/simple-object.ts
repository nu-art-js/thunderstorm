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

import {TestSuit, tsValidateRegexp} from '../_main';
import {TestCase_Validator, validatorProcessor} from './_common';


const simpleObject1: {} = {prop1: 'Adam'};
const simpleObject2: {} = {prop1: 'Adam', prop2: undefined};

export const testSuit_simpleObjectValidator: TestSuit<TestCase_Validator<{}>> = {
	key: 'object-validator--simple-object',
	label: 'Object Validator - Simple Object',
	processor: validatorProcessor,
	models: [
		{expected: 'fail', input: {instance: simpleObject1, validator: {}}},
		{expected: 'fail', input: {instance: simpleObject1, validator: {prop1: tsValidateRegexp(/PaH/)}}},
		{expected: 'pass', input: {instance: simpleObject1, validator: {prop1: tsValidateRegexp(/Adam/)}}},
		{expected: 'fail', input: {instance: {}, validator: {prop1: tsValidateRegexp(/PaH/)}}},
		{expected: 'pass', input: {instance: {}, validator: {prop1: tsValidateRegexp(/PaH/, false)}}},
		{expected: 'fail', input: {instance: simpleObject1, validator: {prop1: tsValidateRegexp(/Adam/), prop2: tsValidateRegexp(/Adam/)}}},
		{expected: 'pass', input: {instance: simpleObject1, validator: {prop1: tsValidateRegexp(/Adam/), prop2: tsValidateRegexp(/Adam/, false)}}},
		{expected: 'fail', input: {instance: simpleObject2, validator: {prop1: tsValidateRegexp(/Adam/), prop2: tsValidateRegexp(/Adam/)}}},
		{expected: 'pass', input: {instance: simpleObject2, validator: {prop1: tsValidateRegexp(/Adam/), prop2: tsValidateRegexp(/Adam/, false)}}},
		{expected: 'pass', input: {instance: simpleObject2, validator: {prop1: tsValidateRegexp(/Adam/), prop2: undefined}}},
	]
};
