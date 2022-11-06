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
	TestSuit,
	// tsValidateObjectValues,
	tsValidateRegexp
} from "../_main";
import {ValidatorTest,} from "./test";
import {validatorProcessor} from "./_common";

type _DynamicProps = { [k: string]: string } | string
type DynamicProps = { [k: string]: _DynamicProps }
const simpleObject1: DynamicProps = {prop1: "Adam"};
const simpleObject2: DynamicProps = {prop1: "Adam", prop2: "Adam"};
const simpleObject3: DynamicProps = {prop1: "Adam", prop2: "Adam", prop3: "Yair"};
const simpleObject4: DynamicProps = {prop1: "Adam", prop2: "Adam", prop3: {k: "Yair"}};


export const testSuit_dynamicPropsObjectValidator: TestSuit<ValidatorTest<DynamicProps>> = {
	key: "object-validator--simple-object",
	label: "Object Validator - Simple Object",
	processor: validatorProcessor,
	models: [
		// {expected: "pass", input: {instance: simpleObject1, validator: tsValidateObjectValues<_DynamicProps>(tsValidateRegexp(/Adam|Yair/))}},
		// {expected: "pass", input: {instance: simpleObject2, validator: tsValidateObjectValues<_DynamicProps>(tsValidateRegexp(/Adam|Yair/))}},
		// {expected: "pass", input: {instance: simpleObject3, validator: tsValidateObjectValues<_DynamicProps>(tsValidateRegexp(/Adam|Yair/))}},
		// {expected: "fail", input: {instance: simpleObject3, validator: tsValidateObjectValues<_DynamicProps>(tsValidateRegexp(/Adam2|Yair/))}},
		// {expected: "fail", input: {instance: simpleObject3, validator: tsValidateObjectValues<_DynamicProps>(tsValidateRegexp(/Adam|Yair2/))}},
		// {expected: "pass", input: {instance: simpleObject4, validator: tsValidateObjectValues<_DynamicProps>(tsValidateRegexp(/Adam|Yair/))}},
		// {expected: "pass", input: {instance: simpleObject4, validator: tsValidateObjectValues<_DynamicProps>(tsValidateRegexp(/Adam|Yair/))}},
		// {expected: "pass", input: {instance: simpleObject4, validator: tsValidateObjectValues<_DynamicProps>(tsValidateRegexp(/Adam|Yair/))}},
		// {expected: "fail", input: {instance: simpleObject4, validator: tsValidateObjectValues<_DynamicProps>(tsValidateRegexp(/Adam2|Yair/))}},
		// {expected: "fail", input: {instance: simpleObject4, validator: tsValidateObjectValues<_DynamicProps>(tsValidateRegexp(/Adam|Yair2/))}},
	]
};
