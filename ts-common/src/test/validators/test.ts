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
	ValidatorTypeResolver,
	TestModel
} from '../../main';
import {testSuit_simpleObjectValidator} from './simple-object';
import {testSuit_nestedObjectValidator} from './nested-object';
import {testSuit_objectWithArrayValidator} from './object-with-array';
import {testSuit_nestedObjectWithArrayValidator} from './nested-object-with-array';
import {testSuit_dynamicPropsObjectValidator} from './dynamic-props-object';
import {testSuit_values} from './values';


export type ValidatorTestInput<T> = {
	instance: T;
	validator: ValidatorTypeResolver<T>;
}

export type ValidatorTest<T> = TestModel<ValidatorTestInput<T>, 'pass' | 'fail'>;

export const testSuits_validator = [
	testSuit_dynamicPropsObjectValidator,
	testSuit_simpleObjectValidator,
	testSuit_nestedObjectValidator,
	testSuit_objectWithArrayValidator,
	testSuit_nestedObjectWithArrayValidator,
	testSuit_values,
];